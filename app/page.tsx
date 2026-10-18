"use client";

import ShareButtons from "./ShareButtons";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
import { diffWords, diffChars } from "diff";

type Language = "bg" | "en" | "fr" | "de";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const HISTORY_DEBOUNCE_MS = 500;
const SESSION_SAVE_DEBOUNCE_MS = 3000;

const translations = {
  bg: {
    title: "TextFix Pro", subtitle: "Интелигентен текстов помощник & Редактор v2.3", chars: "Символа", noSpaces: "Без интервали", words: "Думи", lines: "Редове", paragraphs: "Абзаци", readTime: "Време за четене", readability: "Трудност", readTimeValue: (n: number) => `${n} мин`, pasteBtn: "📋 Постави", upload: "📁 Качете файл (.txt, .md, .json, .docx)", uploadSub: "Поддържа автоматично извличане на текст от Word, Markdown и текстов формат (макс. 10 MB)", undo: "↩️ Назад", redo: "↪️ Напред", copy: "📋 Копирай", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Въведете или поставете вашия текст тук...", aiTools: "🤖 Интелигентни AI инструменти", aiSummary: "✨ AI Резюме", aiFix: "📝 AI Граматика", aiExpand: "🚀 AI Разшири", aiShorten: "📉 AI Скъси", aiSimplify: "🧸 AI Опрости", aiElevate: "🎓 AI Повиши", aiCustomPlaceholder: "Собствена инструкция (напр. 'Направи го като имейл до шефа')...", aiCustomBtn: "Изпълни", aiResultTitle: "🤖 Интелигентен резултат:", copyResult: "📋 Копирай", replaceText: "🔄 Замени", closeResult: "❌ Затвори", processing: "Обработва се...", voiceInput: "🎤 Гласов вход", voiceStop: "⏹️ Спри", speakText: "🔊 Прочети", speakStop: "🔇 Спри", voiceListeningMsg: "🎙️ Записва активно... Говорете!", voiceSpeakingMsg: "🔊 Прочитане...", ttsSettings: "Настройки на гласа", ttsRate: "Скорост", ttsPitch: "Тон", wordFreqTitle: "📊 Честота на думите:", historyTitle: "💾 Запазени сесии:", historyRestore: "Възстанови", historyClear: "Изчисти", markdownTitle: "✍️ Markdown:", previewTitle: "👁️ Преглед", editorTitle: "✏️ Редактор", noTextPreview: "Няма въведен текст.", searchReplace: "🔍 Търсене & Замяна", findPlaceholder: "Търси...", replacePlaceholder: "Замени с...", replaceBtn: "Замени всички", transEngine: "🌐 Превод", engineLabel: "Услуга:", transEn: "На Английски 🇬🇧", transBg: "На Български 🇧🇬", transDe: "На Немски 🇩🇪", transFr: "На Френски 🇫🇷", copyTranslation: "📋 Копирай само превода", translit: "🔠 Транслитерация", cyrToLat: "Кирилица ➔ Латиница", latToCyr: "Латиница ➔ Кирилица", tools: "🛠️ Почистване и Форматиране", uppercase: "ГОЛЕМИ", lowercase: "малки", sentenceCase: "✏️ Изречение", titleCase: "🔠 Заглавие", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Интервали", removeDuplicates: "🗑️ Дубликати", removeEmpty: "📭 Празни редове", sortLinesAsc: "🔤 Сортирай А-Я", sortLinesDesc: "🔤 Сортирай Я-А", clearAll: "Изчисти всичко", proTools: "⚡ PRO Инструменти", encodeBase64: "🔐 Base64 Кодирай", decodeBase64: "🔓 Base64 Декодирай", formatJSON: "📦 Форматирай JSON", buyCoffee: "☕ Кафе", lightTheme: "☀️ Светъл", darkTheme: "🌙 Тъмен", fileTooLarge: "Файлът е твърде голям (макс. 10 MB).", fileLoaded: (name: string) => `Файлът "${name}" е зареден!`, wordFileLoading: "Зареждане на Word...", wordFileLoaded: "Word документът е зареден!", wordFileFallback: "Текстът не можа да се извлече.", wordLoadError: "Грешка при .docx.", noTextToDownload: "Няма текст!", noTextToCopy: "Няма текст за копиране!", noTextToSpeak: "Няма текст за четене!", noTextForAi: "Моля, въведете текст!", noFindWord: "Въведете дума!", noMatches: "Няма съвпадения.", noTextToTranslate: "Няма текст за превод!", aiError: "Грешка от асистента.", aiConnectionError: "Грешка със сървъра.", translateError: "Грешка с преводача.", translateNoResult: "Опитайте друг преводач.", invalidBase64: "Невалиден Base64.", invalidJson: "Невалиден JSON.", encodeError: "Грешка при кодиране.", speechNotSupported: "Браузърът не поддържа глас.", ttsNotSupported: "Браузърът не поддържа четене.", microphoneDenied: "Разрешете микрофона.", listeningError: "Грешка при микрофона.", speaking: "Прочитане...", speakingStopped: "Спряно.", listeningStopped: "Спряно.", micActive: "Микрофонът е активен!", copied: "Копирано!", copiedResult: "Резултатът е копиран!", downloaded: "Изтеглено!", replaced: (n: number) => `Заменени ${n} места!`, resultReady: "Готово!", mainTextReplaced: "Текстът е заменен!", textRestored: "Възстановено!", translitSuccess: "Успешна транслитерация!", upperSuccess: "ГОЛЕМИ БУКВИ!", lowerSuccess: "малки букви!", sentenceSuccess: "Главни букви!", titleSuccess: "Заглавия!", slugSuccess: "Готов Slug!", htmlStripped: "HTML премахнат!", spacesRemoved: "Интервалите са изчистени!", duplicatesRemoved: "Дубликатите са премахнати!", emptyRemoved: "Празните редове са премахнати!", sorted: "Сортирано!", cleared: "Изчистено!", encodeSuccess: "Base64 готово!", decodeSuccess: "Base64 декодирано!", jsonFormatted: "JSON форматиран!", translating: "Превежда се...", translationReady: "Преводът е готов!", confirmClearHistory: "Сигурни ли сте, че искате да изчистите историята?", confirmClearAll: "Сигурни ли сте, че искате да изчистите целия текст?", compareTitle: "🔍 Text Compare (Сравнение)", compareOriginal: "Оригинален текст (преди)", compareNew: "Нов текст (за сравнение)", compareResult: "Резултат от сравнението:", compareEmpty: "Тук ще се покаже резултатът...", compareAdded: "Нови думи", compareRemoved: "Премахнати думи", compareClose: "Затвори", compareCase: "Главни/малки букви", compareWords: "Думи", compareChars: "Символи", tips: { aiSummary: "Резюме на текста", aiFix: "Коригира правопис и граматика", aiExpand: "Разширява текста", aiShorten: "Съкращава текста", aiSimplify: "Опростява езика", aiElevate: "Професионален стил", voiceInput: "Диктуване с микрофон", speakText: "Четене на глас", toLatin: "Кирилица към латиница", toCyrillic: "Латиница към кирилица", uppercase: "Всички букви главни", lowercase: "Всички букви малки", sentenceCase: "Главна буква на изречение", titleCase: "Главна буква на всяка дума", slug: "URL адрес", stripHtml: "Премахва HTML", removeSpaces: "Маха излишни интервали", removeDuplicateLines: "Маха дублиращи се редове", removeEmptyLines: "Маха празни редове", sortLinesAsc: "Сортира А-Я", sortLinesDesc: "Сортира Я-А", encodeBase64: "Base64 кодиране", decodeBase64: "Base64 декодиране", formatJSON: "Подрежда JSON" }
  },
  en: {
    title: "TextFix Pro", subtitle: "Intelligent Text Assistant v2.3", chars: "Characters", noSpaces: "No spaces", words: "Words", lines: "Lines", paragraphs: "Paragraphs", readTime: "Read time", readability: "Readability", readTimeValue: (n: number) => `${n} min`, pasteBtn: "📋 Paste", upload: "📁 Upload file (.txt, .md, .json, .docx)", uploadSub: "Supports text extraction from Word, Markdown, and plain text files (max 10 MB)", undo: "↩️ Undo", redo: "↪️ Redo", copy: "📋 Copy", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Type or paste your text here...", aiTools: "🤖 AI Tools", aiSummary: "✨ AI Summary", aiFix: "📝 AI Fix Grammar", aiExpand: "🚀 AI Expand", aiShorten: "📉 AI Shorten", aiSimplify: "🧸 AI Simplify", aiElevate: "🎓 AI Elevate", aiCustomPlaceholder: "Custom instruction (e.g. 'Make it an email to my boss')...", aiCustomBtn: "Run", aiResultTitle: "🤖 Result:", copyResult: "📋 Copy", replaceText: "🔄 Replace", closeResult: "❌ Close", processing: "Processing...", voiceInput: "🎤 Voice Input", voiceStop: "⏹️ Stop", speakText: "🔊 Read Aloud", speakStop: "🔇 Stop", voiceListeningMsg: "🎙️ Recording active...", voiceSpeakingMsg: "🔊 Reading...", ttsSettings: "Voice Settings", ttsRate: "Rate", ttsPitch: "Pitch", wordFreqTitle: "📊 Word Frequency:", historyTitle: "💾 Saved Sessions:", historyRestore: "Restore", historyClear: "Clear", markdownTitle: "✍️ Markdown:", previewTitle: "👁️ Preview", editorTitle: "✏️ Editor", noTextPreview: "No text to preview.", searchReplace: "🔍 Search & Replace", findPlaceholder: "Find...", replacePlaceholder: "Replace with...", replaceBtn: "Replace All", transEngine: "🌐 Translation", engineLabel: "Service:", transEn: "To English 🇬🇧", transBg: "To Bulgarian 🇧🇬", transDe: "To German 🇩🇪", transFr: "To French 🇫🇷", copyTranslation: "📋 Copy translation", translit: "🔠 Transliteration", cyrToLat: "Cyrillic ➔ Latin", latToCyr: "Latin ➔ Cyrillic", tools: "🛠️ Cleaning & Formatting", uppercase: "UPPERCASE", lowercase: "lowercase", sentenceCase: "✏️ Sentence", titleCase: "🔠 Title Case", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Spaces", removeDuplicates: "🗑️ Duplicates", removeEmpty: "📭 Empty lines", sortLinesAsc: "🔤 Sort A-Z", sortLinesDesc: "🔤 Sort Z-A", clearAll: "Clear All", proTools: "⚡ PRO Tools", encodeBase64: "🔐 Base64 Encode", decodeBase64: "🔓 Base64 Decode", formatJSON: "📦 Format JSON", buyCoffee: "☕ Coffee", lightTheme: "☀️ Light", darkTheme: "🌙 Dark", fileTooLarge: "File too large (max 10 MB).", fileLoaded: (name: string) => `File "${name}" loaded!`, wordFileLoading: "Loading Word...", wordFileLoaded: "Word loaded!", wordFileFallback: "Text could not be extracted.", wordLoadError: "Error reading .docx.", noTextToDownload: "No text!", noTextToCopy: "No text to copy!", noTextToSpeak: "No text to read!", noTextForAi: "Enter text!", noFindWord: "Enter a word!", noMatches: "No matches.", noTextToTranslate: "No text to translate!", aiError: "AI error.", aiConnectionError: "Server error.", translateError: "Translator error.", translateNoResult: "Try another translator.", invalidBase64: "Invalid Base64.", invalidJson: "Invalid JSON.", encodeError: "Encoding error.", speechNotSupported: "Voice not supported.", ttsNotSupported: "TTS not supported.", microphoneDenied: "Allow microphone.", listeningError: "Mic error.", speaking: "Reading...", speakingStopped: "Stopped.", listeningStopped: "Stopped.", micActive: "Mic active!", copied: "Copied!", copiedResult: "Result copied!", downloaded: "Downloaded!", replaced: (n: number) => `Replaced ${n}!`, resultReady: "Done!", mainTextReplaced: "Text replaced!", textRestored: "Restored!", translitSuccess: "Transliterated!", upperSuccess: "UPPERCASE!", lowerSuccess: "lowercase!", sentenceSuccess: "Sentence case!", titleSuccess: "Title case!", slugSuccess: "Slug created!", htmlStripped: "HTML stripped!", spacesRemoved: "Spaces removed!", duplicatesRemoved: "Duplicates removed!", emptyRemoved: "Empty lines removed!", sorted: "Sorted!", cleared: "Cleared!", encodeSuccess: "Base64 done!", decodeSuccess: "Base64 decoded!", jsonFormatted: "JSON formatted!", translating: "Translating...", translationReady: "Translation ready!", confirmClearHistory: "Are you sure you want to clear history?", confirmClearAll: "Are you sure you want to clear all text?", compareTitle: "🔍 Text Compare", compareOriginal: "Original text", compareNew: "New text to compare", compareResult: "Comparison result:", compareEmpty: "Result will appear here...", compareAdded: "New words", compareRemoved: "Removed words", compareClose: "Close", compareCase: "Case sensitive", compareWords: "Words", compareChars: "Characters", tips: { aiSummary: "Summarizes text", aiFix: "Fixes grammar", aiExpand: "Expands text", aiShorten: "Shortens text", aiSimplify: "Simplifies language", aiElevate: "Professional style", voiceInput: "Dictate with mic", speakText: "Read aloud", toLatin: "Cyrillic to Latin", toCyrillic: "Latin to Cyrillic", uppercase: "All uppercase", lowercase: "All lowercase", sentenceCase: "Capitalize sentences", titleCase: "Capitalize words", slug: "URL slug", stripHtml: "Remove HTML", removeSpaces: "Remove extra spaces", removeDuplicateLines: "Remove duplicates", removeEmptyLines: "Remove empty lines", sortLinesAsc: "Sort A-Z", sortLinesDesc: "Sort Z-A", encodeBase64: "Base64 encode", decodeBase64: "Base64 decode", formatJSON: "Format JSON" }
  },
  fr: {
    title: "TextFix Pro", subtitle: "Assistant textuel intelligent v2.3", chars: "Caractères", noSpaces: "Sans espaces", words: "Mots", lines: "Lignes", paragraphs: "Paragraphes", readTime: "Temps de lecture", readability: "Lisibilité", readTimeValue: (n: number) => `${n} min`, pasteBtn: "📋 Coller", upload: "📁 Charger un fichier (.txt, .md, .json, .docx)", uploadSub: "Extraction automatique de texte Word, Markdown et fichier texte (max 10 Mo)", undo: "↩️ Annuler", redo: "↪️ Rétablir", copy: "📋 Copier", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Saisissez ou collez votre texte ici...", aiTools: "🤖 Outils IA", aiSummary: "✨ Résumé IA", aiFix: "📝 Corriger la grammaire", aiExpand: "🚀 Développer", aiShorten: "📉 Raccourcir", aiSimplify: "🧸 Simplifier", aiElevate: "🎓 Élever le style", aiCustomPlaceholder: "Instruction personnalisée (ex. 'Fais-en un email pour mon patron')...", aiCustomBtn: "Exécuter", aiResultTitle: "🤖 Résultat :", copyResult: "📋 Copier", replaceText: "🔄 Remplacer", closeResult: "❌ Fermer", processing: "Traitement...", voiceInput: "🎤 Saisie vocale", voiceStop: "⏹️ Arrêter", speakText: "🔊 Lire à haute voix", speakStop: "🔇 Arrêter", voiceListeningMsg: "🎙️ Enregistrement...", voiceSpeakingMsg: "🔊 Lecture...", ttsSettings: "Paramètres vocaux", ttsRate: "Vitesse", ttsPitch: "Tonalité", wordFreqTitle: "📊 Fréquence des mots :", historyTitle: "💾 Historique :", historyRestore: "Restaurer", historyClear: "Effacer", markdownTitle: "✍️ Markdown :", previewTitle: "👁️ Aperçu", editorTitle: "✏️ Éditeur", noTextPreview: "Aucun texte.", searchReplace: "🔍 Rechercher et Remplacer", findPlaceholder: "Rechercher...", replacePlaceholder: "Remplacer par...", replaceBtn: "Tout remplacer", transEngine: "🌐 Traduction", engineLabel: "Service :", transEn: "En Anglais 🇬🇧", transBg: "En Bulgare 🇧🇬", transDe: "En Allemand 🇩🇪", transFr: "En Français 🇫🇷", copyTranslation: "📋 Copier la traduction", translit: "🔠 Translittération", cyrToLat: "Cyrillique ➔ Latin", latToCyr: "Latin ➔ Cyrillique", tools: "🛠️ Nettoyage & Formatage", uppercase: "MAJUSCULES", lowercase: "minuscules", sentenceCase: "✏️ Phrase", titleCase: "🔠 Titre", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Espaces", removeDuplicates: "🗑️ Doublons", removeEmpty: "📭 Lignes vides", sortLinesAsc: "🔤 Trier A-Z", sortLinesDesc: "🔤 Trier Z-A", clearAll: "Tout effacer", proTools: "⚡ Outils PRO", encodeBase64: "🔐 Encodage Base64", decodeBase64: "🔓 Décodage Base64", formatJSON: "📦 Formater JSON", buyCoffee: "☕ Café", lightTheme: "☀️ Clair", darkTheme: "🌙 Sombre", fileTooLarge: "Fichier trop volumineux (max 10 Mo).", fileLoaded: (name: string) => `Fichier "${name}" chargé !`, wordFileLoading: "Chargement...", wordFileLoaded: "Document chargé !", wordFileFallback: "Texte non extrait.", wordLoadError: "Erreur .docx.", noTextToDownload: "Aucun texte !", noTextToCopy: "Aucun texte à copier !", noTextToSpeak: "Aucun texte à lire !", noTextForAi: "Saisissez du texte !", noFindWord: "Saisissez un mot !", noMatches: "Aucune correspondance.", noTextToTranslate: "Aucun texte à traduire !", aiError: "Erreur IA.", aiConnectionError: "Erreur serveur.", translateError: "Erreur de traduction.", translateNoResult: "Essayez un autre traducteur.", invalidBase64: "Base64 invalide.", invalidJson: "JSON invalide.", encodeError: "Erreur d'encodage.", speechNotSupported: "Voix non supportée.", ttsNotSupported: "TTS non supporté.", microphoneDenied: "Autorisez le micro.", listeningError: "Erreur micro.", speaking: "Lecture...", speakingStopped: "Arrêté.", listeningStopped: "Arrêté.", micActive: "Micro actif !", copied: "Copié !", copiedResult: "Résultat copié !", downloaded: "Téléchargé !", replaced: (n: number) => `${n} remplacé(s) !`, resultReady: "Prêt !", mainTextReplaced: "Texte remplacé !", textRestored: "Restauré !", translitSuccess: "Translittéré !", upperSuccess: "MAJUSCULES !", lowerSuccess: "minuscules !", sentenceSuccess: "Phrase !", titleSuccess: "Titre !", slugSuccess: "Slug créé !", htmlStripped: "HTML supprimé !", spacesRemoved: "Espaces supprimés !", duplicatesRemoved: "Doublons supprimés !", emptyRemoved: "Lignes vides supprimées !", sorted: "Trié !", cleared: "Effacé !", encodeSuccess: "Base64 fait !", decodeSuccess: "Base64 décodé !", jsonFormatted: "JSON formaté !", translating: "Traduction...", translationReady: "Traduction prête !", confirmClearHistory: "Voulez-vous vraiment effacer l'historique ?", confirmClearAll: "Voulez-vous vraiment tout effacer ?", compareTitle: "🔍 Comparaison de texte", compareOriginal: "Texte original", compareNew: "Nouveau texte", compareResult: "Résultat :", compareEmpty: "Le résultat apparaîtra ici...", compareAdded: "Nouveaux mots", compareRemoved: "Mots supprimés", compareClose: "Fermer", compareCase: "Sensible à la casse", compareWords: "Mots", compareChars: "Caractères", tips: { aiSummary: "Résume le texte", aiFix: "Corrige la grammaire", aiExpand: "Développe le texte", aiShorten: "Raccourcit le texte", aiSimplify: "Simplifie le langage", aiElevate: "Style professionnel", voiceInput: "Dicter via micro", speakText: "Lire à haute voix", toLatin: "Cyrillique en latin", toCyrillic: "Latin en cyrillique", uppercase: "Tout en majuscules", lowercase: "Tout en minuscules", sentenceCase: "Majuscule en début de phrase", titleCase: "Majuscule à chaque mot", slug: "Slug URL", stripHtml: "Supprime le HTML", removeSpaces: "Supprime les espaces", removeDuplicateLines: "Supprime les doublons", removeEmptyLines: "Supprime les lignes vides", sortLinesAsc: "Trier A-Z", sortLinesDesc: "Trier Z-A", encodeBase64: "Encodage Base64", decodeBase64: "Décodage Base64", formatJSON: "Formater JSON" }
  },
  de: {
    title: "TextFix Pro", subtitle: "Intelligenter Textassistent v2.3", chars: "Zeichen", noSpaces: "Ohne Leerzeichen", words: "Wörter", lines: "Zeilen", paragraphs: "Absätze", readTime: "Lesezeit", readability: "Lesbarkeit", readTimeValue: (n: number) => `${n} Min.`, pasteBtn: "📋 Einfügen", upload: "📁 Datei hochladen (.txt, .md, .json, .docx)", uploadSub: "Automatische Textextraktion (max. 10 MB)", undo: "↩️ Rückgängig", redo: "↪️ Wiederholen", copy: "📋 Kopieren", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Geben Sie Ihren Text hier ein...", aiTools: "🤖 KI-Werkzeuge", aiSummary: "✨ KI Zusammenfassung", aiFix: "📝 KI Grammatik", aiExpand: "🚀 KI Erweitern", aiShorten: "📉 KI Kürzen", aiSimplify: "🧸 KI Vereinfachen", aiElevate: "🎓 KI Niveau erhöhen", aiCustomPlaceholder: "Eigene Anweisung (z.B. 'Mach eine E-Mail an meinen Chef daraus')...", aiCustomBtn: "Ausführen", aiResultTitle: "🤖 Ergebnis:", copyResult: "📋 Kopieren", replaceText: "🔄 Ersetzen", closeResult: "❌ Schließen", processing: "Verarbeitung...", voiceInput: "🎤 Spracheingabe", voiceStop: "⏹️ Stopp", speakText: "🔊 Vorlesen", speakStop: "🔇 Stopp", voiceListeningMsg: "🎙️ Aufnahme...", voiceSpeakingMsg: "🔊 Vorlesen...", ttsSettings: "Spracheinstellungen", ttsRate: "Geschwindigkeit", ttsPitch: "Tonhöhe", wordFreqTitle: "📊 Worthäufigkeit:", historyTitle: "💾 Verlauf:", historyRestore: "Wiederherstellen", historyClear: "Löschen", markdownTitle: "✍️ Markdown:", previewTitle: "👁️ Vorschau", editorTitle: "✏️ Editor", noTextPreview: "Kein Text.", searchReplace: "🔍 Suchen & Ersetzen", findPlaceholder: "Suchen...", replacePlaceholder: "Ersetzen durch...", replaceBtn: "Alle ersetzen", transEngine: "🌐 Übersetzung", engineLabel: "Dienst:", transEn: "Ins Englische 🇬🇧", transBg: "Ins Bulgarische 🇧🇬", transDe: "Ins Deutsche 🇩🇪", transFr: "Ins Französische 🇫🇷", copyTranslation: "📋 Übersetzung kopieren", translit: "🔠 Transliteration", cyrToLat: "Kyrillisch ➔ Lateinisch", latToCyr: "Lateinisch ➔ Kyrillisch", tools: "🛠️ Bereinigung & Formatierung", uppercase: "GROSSBUCHSTABEN", lowercase: "kleinbuchstaben", sentenceCase: "✏️ Satzanfang groß", titleCase: "🔠 Wortanfänge Groß", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Leerzeichen", removeDuplicates: "🗑️ Duplikate", removeEmpty: "📭 Leere Zeilen", sortLinesAsc: "🔤 Sortieren A-Z", sortLinesDesc: "🔤 Sortieren Z-A", clearAll: "Alles löschen", proTools: "⚡ PRO Werkzeuge", encodeBase64: "🔐 Base64 Kodieren", decodeBase64: "🔓 Base64 Dekodieren", formatJSON: "📦 JSON Formatieren", buyCoffee: "☕ Kaffee", lightTheme: "☀️ Hell", darkTheme: "🌙 Dunkel", fileTooLarge: "Datei zu groß (max. 10 MB).", fileLoaded: (name: string) => `Datei "${name}" geladen!`, wordFileLoading: "Word wird geladen...", wordFileLoaded: "Word geladen!", wordFileFallback: "Text konnte nicht extrahiert werden.", wordLoadError: "Fehler beim Lesen der .docx.", noTextToDownload: "Kein Text!", noTextToCopy: "Kein Text zum Kopieren!", noTextToSpeak: "Kein Text zum Vorlesen!", noTextForAi: "Text eingeben!", noFindWord: "Wort eingeben!", noMatches: "Keine Treffer.", noTextToTranslate: "Kein Text zum Übersetzen!", aiError: "KI-Fehler.", aiConnectionError: "Serverfehler.", translateError: "Übersetzungsfehler.", translateNoResult: "Versuchen Sie einen anderen Übersetzer.", invalidBase64: "Ungültiges Base64.", invalidJson: "Ungültiges JSON.", encodeError: "Kodierungsfehler.", speechNotSupported: "Spracheingabe nicht unterstützt.", ttsNotSupported: "Vorlesen nicht unterstützt.", microphoneDenied: "Mikrofon erlauben.", listeningError: "Mikrofonfehler.", speaking: "Vorlesen...", speakingStopped: "Gestoppt.", listeningStopped: "Gestoppt.", micActive: "Mikrofon aktiv!", copied: "Kopiert!", copiedResult: "Ergebnis kopiert!", downloaded: "Heruntergeladen!", replaced: (n: number) => `${n} ersetzt!`, resultReady: "Bereit!", mainTextReplaced: "Text ersetzt!", textRestored: "Wiederhergestellt!", translitSuccess: "Transliteriert!", upperSuccess: "GROSSBUCHSTABEN!", lowerSuccess: "kleinbuchstaben!", sentenceSuccess: "Satzanfang groß!", titleSuccess: "Wortanfänge groß!", slugSuccess: "Slug erstellt!", htmlStripped: "HTML entfernt!", spacesRemoved: "Leerzeichen entfernt!", duplicatesRemoved: "Duplikate entfernt!", emptyRemoved: "Leere Zeilen entfernt!", sorted: "Sortiert!", cleared: "Gelöscht!", encodeSuccess: "Base64 fertig!", decodeSuccess: "Base64 dekodiert!", jsonFormatted: "JSON formatiert!", translating: "Übersetzung...", translationReady: "Übersetzung fertig!", confirmClearHistory: "Verlauf wirklich löschen?", confirmClearAll: "Wirklich alles löschen?", compareTitle: "🔍 Text Vergleich", compareOriginal: "Originaltext", compareNew: "Neuer Text", compareResult: "Ergebnis:", compareEmpty: "Ergebnis erscheint hier...", compareAdded: "Neue Wörter", compareRemoved: "Entfernte Wörter", compareClose: "Schließen", compareCase: "Groß-/Kleinschreibung", compareWords: "Wörter", compareChars: "Zeichen", tips: { aiSummary: "Fasst Text zusammen", aiFix: "Korrigiert Grammatik", aiExpand: "Erweitert Ideen", aiShorten: "Kürzt den Text", aiSimplify: "Vereinfacht die Sprache", aiElevate: "Professioneller Stil", voiceInput: "Diktieren", speakText: "Vorlesen", toLatin: "Kyrillisch zu Latein", toCyrillic: "Latein zu Kyrillisch", uppercase: "Alles groß", lowercase: "Alles klein", sentenceCase: "Satzanfang groß", titleCase: "Wortanfänge groß", slug: "URL-Slug", stripHtml: "Entfernt HTML", removeSpaces: "Entfernt Leerzeichen", removeDuplicateLines: "Entfernt Duplikate", removeEmptyLines: "Entfernt Leerzeilen", sortLinesAsc: "Sortieren A-Z", sortLinesDesc: "Sortieren Z-A", encodeBase64: "Base64 kodieren", decodeBase64: "Base64 dekodieren", formatJSON: "JSON formatieren" }
  },
};

type Translation = (typeof translations)["bg"];

// --- Helper functions ---
function calculateReadability(text: string): number {
  if (!text.trim()) return 0;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const words = text.trim().split(/\s+/).length;
  const syllables = text.toLowerCase().replace(/[^a-zа-яё]/g, "").replace(/[aeiouyаеиоуъюя]+/g, "a").length;
  if (words === 0 || sentences === 0) return 0;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

function getReadabilityLabel(score: number, lang: string): string {
  if (score === 0) return "-";
  const labels: Record<string, string[]> = {
    bg: ["Много труден", "Труден", "Среден", "Лесен", "Много лесен"],
    en: ["Very Hard", "Hard", "Medium", "Easy", "Very Easy"],
    fr: ["Très difficile", "Difficile", "Moyen", "Facile", "Très facile"],
    de: ["Sehr schwer", "Schwer", "Mittel", "Einfach", "Sehr einfach"],
  };
  const arr = labels[lang] || labels.en;
  if (score < 30) return arr[0];
  if (score < 50) return arr[1];
  if (score < 60) return arr[2];
  if (score < 80) return arr[3];
  return arr[4];
}

// --- Components ---
interface TooltipButtonProps {
  onClick: () => void;
  text: string;
  tip: string;
  isPro?: boolean;
  isAi?: boolean;
  isLoading?: boolean;
  isLight: boolean;
  processingText: string;
}

function TooltipButton({ onClick, text, tip, isPro = false, isAi = false, isLoading = false, isLight, processingText }: TooltipButtonProps) {
  let btnStyle = "";
  if (isAi) btnStyle = isLight ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm" : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md";
  else if (isPro) btnStyle = isLight ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";
  else btnStyle = isLight ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm" : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800";

  return (
    <div className="relative group inline-block w-full">
      <button type="button" onClick={onClick} disabled={isLoading} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${btnStyle}`}>
        {isLoading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {isLoading ? processingText : text}
      </button>
      <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-help shadow-sm ${isAi ? "bg-blue-500 text-white" : isLight ? "bg-slate-300 text-slate-700" : "bg-slate-700 text-slate-300"}`} aria-hidden="true">i</span>
      <div role="tooltip" className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal max-w-xs text-center z-50 pointer-events-none ${isLight ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-slate-900 text-slate-200 border-slate-700"}`}>{tip}</div>
    </div>
  );
}

export default function Home() {
  // 1. Език: Зарежда от localStorage, после от браузъра, иначе английски
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("textfix_lang") as Language;
      if (storedLang && ["bg", "en", "fr", "de"].includes(storedLang)) return storedLang;
      
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("bg")) return "bg";
      if (browserLang.startsWith("fr")) return "fr";
      if (browserLang.startsWith("de")) return "de";
      return "en"; // Default to English
    }
    return "bg"; // Fallback for server
  });

  const [isLight, setIsLight] = useState(false);
  const [text, setText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [typedAiResult, setTypedAiResult] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedHistory, setSavedHistory] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Text Compare states
  const [showCompare, setShowCompare] = useState(false);
  const [compareText, setCompareText] = useState("");
  const [compareMode, setCompareMode] = useState<"words" | "chars">("words");
  const [isCaseSensitive, setIsCaseSensitive] = useState(true);

  const [findVal, setFindVal] = useState("");
  const [replaceVal, setReplaceVal] = useState("");
  const [engine, setEngine] = useState("google");
  const [toastMsg, setToastMsg] = useState("");

  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const recognitionRestartCountRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const t: Translation = translations[lang];

  // Load saved data
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("textfix_history");
      if (storedHistory) { const parsed = JSON.parse(storedHistory); if (Array.isArray(parsed)) setSavedHistory(parsed); }
      const storedTheme = localStorage.getItem("textfix_theme");
      if (storedTheme === "light" || storedTheme === "dark") setIsLight(storedTheme === "light");
    } catch (e) { console.error(e); }
  }, []);

  // Theme & HTML lang attribute
  useEffect(() => {
    try { localStorage.setItem("textfix_theme", isLight ? "light" : "dark"); } catch (e) { console.error(e); }
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", !isLight);
      document.documentElement.lang = lang; // За екранните четци!
    }
  }, [isLight, lang]);

  // Save Language
  useEffect(() => {
    try { localStorage.setItem("textfix_lang", lang); } catch (e) { console.error(e); }
  }, [lang]);

  // Auto-save history
  useEffect(() => {
    if (!text.trim()) return;
    const timer = setTimeout(() => {
      setSavedHistory((prev) => {
        if (prev[0] === text) return prev;
        const filtered = prev.filter((item) => item !== text);
        const updated = [text, ...filtered].slice(0, 5);
        try { localStorage.setItem("textfix_history", JSON.stringify(updated)); } catch (e) { console.error(e); }
        return updated;
      });
    }, SESSION_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { } }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(""), 3000);
  }, []);

  useEffect(() => {
    if (isSpeaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); setIsSpeaking(false);
    }
  }, [text]);

  const commitHistory = useCallback((newText: string) => {
    setHistory((prevHistory) => {
      const base = prevHistory.slice(0, historyIndex + 1);
      if (base[base.length - 1] === newText) return prevHistory;
      const updated = [...base, newText];
      if (updated.length > 100) updated.shift();
      return updated;
    });
    setHistoryIndex((prevIdx) => Math.min(history.slice(0, prevIdx + 1).length, 99));
  }, [history, historyIndex]);

  const updateText = useCallback((newText: string, msg?: string, debounce = false) => {
    if (newText === text) return;
    setText(newText); if (msg) showToast(msg);
    if (debounce) {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => commitHistory(newText), HISTORY_DEBOUNCE_MS);
    } else {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      commitHistory(newText);
    }
  }, [text, showToast, commitHistory]);

  const undo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setText(history[historyIndex - 1]); showToast(t.undo); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setText(history[historyIndex + 1]); showToast(t.redo); } };

  const charCount = text.length;
  const charNoSpaces = useMemo(() => text.replace(/\s/g, "").length, [text]);
  const wordCount = useMemo(() => (text.trim() === "" ? 0 : text.trim().split(/\s+/).length), [text]);
  const lineCount = useMemo(() => (text.trim() === "" ? 0 : text.split(/\r\n|\r|\n/).length), [text]);
  const paragraphCount = useMemo(() => (text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== "").length), [text]);
  const readTime = Math.ceil(wordCount / 200);
  const readabilityScore = useMemo(() => calculateReadability(text), [text]);
  const readabilityLabel = useMemo(() => getReadabilityLabel(readabilityScore, lang), [readabilityScore, lang]);

  const topWords = useMemo(() => {
    if (!text.trim()) return [];
    const stopWords = new Set(["и", "в", "на", "с", "за", "че", "от", "по", "да", "как", "се", "не", "е", "съм", "ще", "the", "and", "to", "of", "a", "in", "is", "it", "you", "that"]);
    const wordsArr = text.toLowerCase().match(/[a-zа-я0-9]+/gi) || [];
    const freqMap: Record<string, number> = {};
    wordsArr.forEach((w) => { if (w.length > 2 && !stopWords.has(w)) freqMap[w] = (freqMap[w] || 0) + 1; });
    return Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [text]);

  const handlePaste = async () => {
    try { const t = await navigator.clipboard.readText(); updateText(t, "Поставено!"); } catch { showToast("Грешка при достъп до клипборда."); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    if (file.size > MAX_FILE_SIZE) return showToast(t.fileTooLarge);
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (fileExt === "docx") {
      try {
        showToast(t.wordFileLoading);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        updateText(result.value.trim(), t.wordFileLoaded);
      } catch { showToast(t.wordLoadError); }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => updateText((event.target?.result as string), t.fileLoaded(file.name));
      reader.onerror = () => showToast(t.wordLoadError);
      reader.readAsText(file);
    }
  };

  const downloadTxt = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "TextFix.txt");
    showToast(t.downloaded);
  };

  const downloadDocx = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const paragraphs = text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }));
    const doc = new Document({ sections: [{ children: paragraphs }] });
    Packer.toBlob(doc).then((blob) => { saveAs(blob, "TextFix.docx"); showToast(t.downloaded); });
  };

  const downloadPdf = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 15);
    doc.save("TextFix.pdf");
    showToast(t.downloaded);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return showToast(t.speechNotSupported);
    if (isListening) {
      isListeningRef.current = false; setIsListening(false);
      try { recognitionRef.current?.stop(); } catch { }
      return showToast(t.listeningStopped);
    }
    try {
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition; isListeningRef.current = true; recognitionRestartCountRef.current = 0;
      recognition.lang = lang === "bg" ? "bg-BG" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-US";
      recognition.continuous = true; recognition.interimResults = true;
      recognition.onstart = () => { setIsListening(true); showToast(t.micActive); };
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) transcript += event.results[i][0].transcript + " ";
        if (transcript) setText((prev) => prev ? prev + " " + transcript.trim() : transcript.trim());
      };
      recognition.onerror = (e) => { if (e.error === "not-allowed") { showToast(t.microphoneDenied); isListeningRef.current = false; setIsListening(false); } };
      recognition.onend = () => {
        if (isListeningRef.current && recognitionRestartCountRef.current < 5) { recognitionRestartCountRef.current++; try { recognition.start(); } catch { setIsListening(false); } }
        else { setIsListening(false); isListeningRef.current = false; }
      };
      recognition.start();
    } catch { showToast(t.listeningError); isListeningRef.current = false; setIsListening(false); }
  };

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return showToast(t.ttsNotSupported);
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return showToast(t.speakingStopped); }
    if (!text.trim()) return showToast(t.noTextToSpeak);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "bg" ? "bg-BG" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-US";
    utterance.rate = ttsRate; utterance.pitch = ttsPitch;
    utterance.onend = () => setIsSpeaking(false); utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true); window.speechSynthesis.speak(utterance); showToast(t.speaking);
  };

  const insertMarkdown = (syntax: string) => {
    if (syntax === "bold") updateText(text + " **bold** "); else if (syntax === "italic") updateText(text + " *italic* ");
    else if (syntax === "h1") updateText(text + "\n# H1\n"); else if (syntax === "list") updateText(text + "\n- List\n");
  };

  const copyText = async () => { if (!text.trim()) return showToast(t.noTextToCopy); try { await navigator.clipboard.writeText(text); showToast(t.copied); } catch { } };

  const startTypewriter = (fullText: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setTypedAiResult("");
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      setTypedAiResult((prev) => prev + fullText.charAt(i));
      i++;
      if (i >= fullText.length) { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); }
    }, 10);
  };

  const handleAiAction = async (actionType: string, customInst: string = "") => {
    if (!text.trim()) return showToast(t.noTextForAi);
    setLoadingAction(actionType); setAiResult(""); setTypedAiResult(""); showToast(t.processing);
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, action: actionType, customInstruction: customInst }) });
      if (!response.ok) { const err = await response.json(); console.error(err); return showToast(t.aiError); }
      const data = await response.json();
      if (data?.result) { setAiResult(data.result); startTypewriter(data.result); showToast(t.resultReady); }
      else showToast(t.aiError);
    } catch { showToast(t.aiConnectionError); } finally { setLoadingAction(null); }
  };

  const handleReplace = () => {
    if (!findVal) return showToast(t.noFindWord);
    const matches = text.split(findVal).length - 1;
    if (matches === 0) return showToast(t.noMatches);
    updateText(text.split(findVal).join(replaceVal), t.replaced(matches));
  };

  const translateText = async (sourceLang: string, targetLang: string) => {
    if (!text.trim()) return showToast(t.noTextToTranslate);
    showToast(t.translating);
    try {
      let translated = "";
      if (engine === "google") {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json(); if (data && data[0]) data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
      } else if (engine === "mymemory") {
        const sl = sourceLang === "auto" ? "bg" : sourceLang;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${targetLang}`);
        const data = await res.json(); if (data?.responseData?.translatedText) translated = data.responseData.translatedText;
      } else if (engine === "lingva") {
        const sl = sourceLang === "auto" ? "auto" : sourceLang;
        const res = await fetch(`https://lingva.ml/api/v1/${sl}/${targetLang}/${encodeURIComponent(text)}`);
        const data = await res.json(); if (data?.translation) translated = data.translation;
      }
      if (translated) { setAiResult(translated); setTypedAiResult(translated); showToast(t.translationReady); }
      else showToast(t.translateNoResult);
    } catch { showToast(t.translateError); }
  };

  const toLatin = () => {
    const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sht",ъ:"a",ь:"y",ю:"yu",я:"ya",А:"A",Б:"B",В:"V",Г:"G",Д:"D",Е:"E",Ж:"Zh",З:"Z",И:"I",Й:"Y",К:"K",Л:"L",М:"M",Н:"N",О:"O",П:"P",Р:"R",С:"S",Т:"T",У:"U",Ф:"F",Х:"H",Ц:"Ts",Ч:"Ch",Ш:"Sh",Щ:"Sht",Ъ:"A",Ь:"Y",Ю:"Yu",Я:"Ya" };
    let res = ""; for (const c of text) res += map[c] ?? c; updateText(res, t.translitSuccess);
  };

  const toCyrillic = () => {
    let tText = text; if (!tText.trim()) return;
    tText = tText.replace(/\bzdrvei\b/gi, "zdravei").replace(/([aeouаеоу])i\b/gi, "$1й").replace(/([AEOUАЕОУ])I\b/g, "$1Й");
    const multiMap: Array<[string, string]> = [["sht","щ"],["Sht","Щ"],["zh","ж"],["Zh","Ж"],["ch","ч"],["Ch","Ч"],["sh","ш"],["Sh","Ш"],["ts","ц"],["Ts","Ц"],["yu","ю"],["Yu","Ю"],["ya","я"],["Ya","Я"]];
    for (const [en, bg] of multiMap) tText = tText.split(en).join(bg);
    const singleMap: Record<string, string> = { a:"а",b:"б",v:"в",g:"г",d:"д",e:"е",z:"з",i:"и",y:"й",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",r:"р",s:"с",t:"т",u:"у",f:"ф",h:"х",c:"ц",w:"в",A:"А",B:"Б",V:"В",G:"Г",D:"Д",E:"Е",Z:"З",I:"И",Y:"Й",K:"К",L:"Л",M:"М",N:"Н",O:"О",P:"П",R:"Р",S:"С",T:"Т",U:"У",F:"Ф",H:"Х",C:"Ц",W:"В" };
    let res = ""; for (const c of tText) res += singleMap[c] ?? c; updateText(res, t.translitSuccess);
  };

  const makeBIG = () => updateText(text.toUpperCase(), t.upperSuccess);
  const makeSmall = () => updateText(text.toLowerCase(), t.lowerSuccess);
  const capitalizeSentences = () => updateText(text.replace(/(^|[.!?]\s+|\n\s*)([a-zа-яё])/gi, (_m, p, l) => p + l.toUpperCase()), t.sentenceSuccess);
  const capitalizeTitleCase = () => updateText(text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase()), t.titleSuccess);
  const makeSlug = () => {
    const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sht",ъ:"a",ь:"y",ю:"yu",я:"ya" };
    let slug = ""; for (const c of text.toLowerCase()) slug += map[c] ?? c;
    updateText(slug.replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s]+/g, "-"), t.slugSuccess);
  };
  const stripHtmlTags = () => updateText(text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+(>|$)/g, "").replace(/\n\s*\n/g, "\n\n").trim(), t.htmlStripped);
  const removeSpaces = () => updateText(text.replace(/[ \t]+/g, " ").trim(), t.spacesRemoved);
  const removeDuplicateLines = () => { const lines = text.split(/\r?\n/); updateText([...new Set(lines)].join("\n"), t.duplicatesRemoved); };
  const removeEmptyLines = () => updateText(text.split(/\r?\n/).filter((l) => l.trim() !== "").join("\n"), t.emptyRemoved);
  const sortLinesAsc = () => updateText(text.split(/\r?\n/).sort((a, b) => a.localeCompare(b, lang)).join("\n"), t.sorted);
  const sortLinesDesc = () => updateText(text.split(/\r?\n/).sort((a, b) => b.localeCompare(a, lang)).join("\n"), t.sorted);

  const encodeBase64 = () => { try { const b = new TextEncoder().encode(text); let bin = ""; b.forEach((x) => (bin += String.fromCharCode(x))); updateText(btoa(bin), t.encodeSuccess); } catch { showToast(t.encodeError); } };
  const decodeBase64 = () => { try { const bin = atob(text); const b = Uint8Array.from(bin, (c) => c.charCodeAt(0)); updateText(new TextDecoder().decode(b), t.decodeSuccess); } catch { showToast(t.invalidBase64); } };
  const formatJSON = () => { try { updateText(JSON.stringify(JSON.parse(text), null, 2), t.jsonFormatted); } catch { showToast(t.invalidJson); } };

  const clearAll = () => { if (window.confirm(t.confirmClearAll)) updateText("", t.cleared); };
  const clearHistory = () => { if (window.confirm(t.confirmClearHistory)) { try { localStorage.removeItem("textfix_history"); } catch { } setSavedHistory([]); } };

  const charCounterColor = charCount > 5000 ? "text-rose-500 font-bold" : "text-blue-600";

  return (
    <main className={`min-h-screen transition-colors duration-300 p-4 md:p-10 font-sans flex flex-col items-center ${isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"}`}>
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Хедър */}
        <header className={`flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div>
            <h1 className={`text-3xl font-extrabold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.title}</h1>
            <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex p-1 rounded-lg border gap-1 ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
              {(["bg", "en", "fr", "de"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${lang === l ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                  <span className="text-sm">{l === "bg" ? "🇧🇬" : l === "en" ? "🇬🇧" : l === "fr" ? "🇫🇷" : "🇩🇪"}</span> {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1 shadow-sm">{t.buyCoffee}</a>
            <button type="button" onClick={() => setIsLight(!isLight)} className={`text-xs px-3 py-2 rounded-lg transition-all border font-medium ${isLight ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100" : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"}`}>
              {isLight ? t.darkTheme : t.lightTheme}
            </button>
          </div>
        </header>

        <ShareButtons lang={lang} />

        {/* Статистика и Paste */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 text-center">
          <button type="button" onClick={handlePaste} className={`p-3 rounded-xl border shadow-sm transition-all flex flex-col items-center justify-center ${isLight ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700" : "bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-200"}`}>
            <div className="text-lg">{t.pasteBtn}</div>
          </button>
          <div className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className={`text-lg font-bold ${charCounterColor}`}>{charCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.chars}</div>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-lg font-bold text-blue-600">{wordCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.words}</div>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-lg font-bold text-blue-600">{lineCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.lines}</div>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-lg font-bold text-blue-600">{readTime}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.readTime}</div>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-[11px] font-bold text-blue-600 truncate" title={readabilityLabel}>{readabilityLabel}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.readability}</div>
          </div>
        </div>

        <label className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer block transition-all ${isLight ? "border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-slate-700" : "border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-slate-200"}`}>
          <div className="text-xs md:text-sm font-semibold">{t.upload}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.uploadSub}</div>
          <input type="file" accept=".txt,.csv,.md,.html,.js,.json,.docx" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Гласови и Експорт */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="space-x-2 flex items-center">
              <button type="button" onClick={toggleVoiceInput} className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${isListening ? "bg-rose-600 text-white border-rose-600 shadow-md animate-pulse" : isLight ? "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300" : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"}`}>{isListening ? t.voiceStop : t.voiceInput}</button>
              <div className="relative group inline-block">
                <button type="button" onClick={toggleSpeech} className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${isSpeaking ? "bg-amber-600 text-white border-amber-600 shadow-md animate-pulse" : isLight ? "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300" : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"}`}>{isSpeaking ? t.speakStop : t.speakText}</button>
                <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 w-48 z-50">
                  <div className="text-slate-200 text-[11px] font-semibold mb-2">{t.ttsSettings}</div>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col text-[10px] text-slate-400">{t.ttsRate} <input type="range" min="0.5" max="2" step="0.1" value={ttsRate} onChange={(e) => setTtsRate(parseFloat(e.target.value))} /></label>
                    <label className="flex flex-col text-[10px] text-slate-400">{t.ttsPitch} <input type="range" min="0.5" max="2" step="0.1" value={ttsPitch} onChange={(e) => setTtsPitch(parseFloat(e.target.value))} /></label>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-x-2 flex items-center">
              <button type="button" onClick={copyText} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.copy}</button>
              <button type="button" onClick={downloadTxt} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.downloadTxt}</button>
              <button type="button" onClick={downloadDocx} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.downloadDocx}</button>
              <button type="button" onClick={downloadPdf} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.downloadPdf}</button>
            </div>
          </div>

          {(isListening || isSpeaking) && (
            <div className={`p-3.5 rounded-xl border flex flex-col space-y-2 text-xs font-semibold shadow-inner ${isListening ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300" : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />{isListening ? t.voiceListeningMsg : t.voiceSpeakingMsg}</span>
                <span className="text-[10px] opacity-80">{isListening ? "REC • 16kHz" : "TTS Audio"}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden"><div className={`h-full rounded-full animate-pulse transition-all duration-300 ${isListening ? "bg-rose-500 w-full" : "bg-amber-500 w-full"}`} /></div>
            </div>
          )}
        </div>

        {/* Undo/Redo + Markdown + Преглед + Сравнение */}
        <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"}`}>
          <div className="flex items-center gap-1.5 border-r pr-3 border-slate-300 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">↕</span>
            <button type="button" onClick={undo} disabled={historyIndex <= 0} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`}>{t.undo}</button>
            <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`}>{t.redo}</button>
          </div>
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <span className="font-semibold text-slate-500 mr-1 hidden sm:inline">{t.markdownTitle}</span>
            <button type="button" onClick={() => insertMarkdown("bold")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700">B</button>
            <button type="button" onClick={() => insertMarkdown("italic")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 italic rounded border border-slate-300 dark:border-slate-700">I</button>
            <button type="button" onClick={() => insertMarkdown("h1")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700">H1</button>
            <button type="button" onClick={() => insertMarkdown("list")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700">• List</button>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setShowCompare(!showCompare)} className={`px-3 py-1 rounded-lg font-semibold shadow-sm transition-all ${showCompare ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
              🔍 Сравни
            </button>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm">{showPreview ? t.editorTitle : t.previewTitle}</button>
          </div>
        </div>

        {/* Текстова площ / Сравнение */}
        {showCompare ? (
          <div className={`w-full rounded-xl border overflow-hidden ${isLight ? "bg-white border-slate-300 shadow-sm" : "bg-slate-900 border-slate-800 shadow-lg"}`}>
            
            <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-3 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{t.compareTitle}</span>
                <button onClick={() => { setCompareText(""); }} className="text-amber-500 hover:text-amber-600 text-lg font-bold" title="Изчисти">↻</button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isCaseSensitive} onChange={(e) => setIsCaseSensitive(e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" />
                  <span className={isLight ? "text-slate-600" : "text-slate-400"}>{t.compareCase}</span>
                </label>
                <div className={`flex p-0.5 rounded-lg border ${isLight ? "bg-slate-200 border-slate-300" : "bg-slate-800 border-slate-700"}`}>
                  <button type="button" onClick={() => setCompareMode("words")} className={`px-2 py-1 rounded-md text-[10px] font-bold ${compareMode === "words" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"}`}>{t.compareWords}</button>
                  <button type="button" onClick={() => setCompareMode("chars")} className={`px-2 py-1 rounded-md text-[10px] font-bold ${compareMode === "chars" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"}`}>{t.compareChars}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isLight ? "text-slate-500" : "text-slate-400"}`}>{t.compareOriginal}</label>
                <textarea value={text} readOnly className={`w-full h-32 p-3 text-xs font-mono rounded-lg border ${isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-950 border-slate-800 text-slate-400"}`} />
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isLight ? "text-slate-500" : "text-slate-400"}`}>{t.compareNew}</label>
                <textarea value={compareText} onChange={(e) => setCompareText(e.target.value)} placeholder="Постави новия текст тук..." className={`w-full h-32 p-3 text-xs font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-900 border-slate-700 text-slate-100"}`} />
              </div>
            </div>

            <div className={`p-4 ${isLight ? "bg-white" : "bg-slate-900"}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>{t.compareResult}</span>
                <div className="flex gap-3 text-[10px] font-semibold">
                  <span className="text-emerald-500">{t.compareAdded}: {diffWords(text, compareText).filter(p => p.added).reduce((acc, p) => acc + p.value.split(/\s+/).filter(w=>w).length, 0)}</span>
                  <span className="text-rose-500">{t.compareRemoved}: {diffWords(text, compareText).filter(p => p.removed).reduce((acc, p) => acc + p.value.split(/\s+/).filter(w=>w).length, 0)}</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border text-sm leading-relaxed overflow-y-auto max-h-60 whitespace-pre-wrap ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>
                {compareText.trim() ? (
                  (compareMode === "words" ? diffWords : diffChars)(text, compareText, { ignoreCase: !isCaseSensitive }).map((part, index) => (
                    <span key={index} className={
                      part.added ? "bg-emerald-200 text-emerald-900 font-medium px-1 rounded" :
                      part.removed ? "bg-rose-200 text-rose-900 line-through px-1 rounded" : 
                      isLight ? "text-slate-700" : "text-slate-300"
                    }>
                      {part.value}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-xs">{t.compareEmpty}</span>
                )}
              </div>
            </div>
            
            <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowCompare(false)} className="text-xs text-rose-500 hover:underline font-semibold">{t.compareClose}</button>
            </div>
          </div>
        ) : !showPreview ? (
          <textarea ref={textAreaRef} value={text} onChange={(e) => updateText(e.target.value, undefined, true)} placeholder={t.placeholder} className={`w-full h-48 p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm resize-y transition-all ${isLight ? "bg-white text-slate-900 border-slate-300 shadow-sm" : "bg-slate-900/90 text-slate-100 border-slate-800"}`} />
        ) : (
          <div className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm font-sans whitespace-pre-wrap ${isLight ? "bg-white text-slate-900 border-slate-300" : "bg-slate-900 text-slate-100 border-slate-800"}`}>{text || t.noTextPreview}</div>
        )}

        {/* Честотен анализ */}
        {topWords.length > 0 && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-slate-900 border-slate-800 text-amber-300"}`}>
            <div className="flex justify-between items-center"><span className="font-bold">{t.wordFreqTitle}</span></div>
            <div className="flex flex-wrap gap-2 pt-1">
              {topWords.map(([word, count], idx) => (<span key={idx} className="bg-amber-200 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-800 dark:text-slate-200">&quot;{word}&quot;: {count}x</span>))}
            </div>
          </div>
        )}

        {/* История */}
        {savedHistory.length > 0 && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">{t.historyTitle}</span>
              <button type="button" onClick={clearHistory} className="text-rose-500 hover:underline">{t.historyClear}</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {savedHistory.map((item, idx) => (<button type="button" key={idx} onClick={() => updateText(item, t.textRestored)} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded text-[11px] truncate max-w-[200px] border border-slate-200 dark:border-slate-700">{item.slice(0, 25)}...</button>))}
            </div>
          </div>
        )}

        {/* AI Резултат */}
        {aiResult && (
          <div className={`p-4 rounded-xl space-y-3 border shadow-lg transition-all ${isLight ? "bg-blue-50/80 border-blue-200" : "bg-slate-900 border-slate-700"}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t.aiResultTitle}</span>
              <button type="button" onClick={() => { setAiResult(""); setTypedAiResult(""); }} className={`text-xs font-semibold px-2 py-1 rounded border transition-all ${isLight ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-100" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>{t.closeResult}</button>
            </div>
            <textarea value={typedAiResult || aiResult} readOnly className={`w-full h-48 p-4 rounded-xl border font-sans text-sm resize-y focus:outline-none ${isLight ? "bg-white text-slate-900 border-blue-200" : "bg-slate-950 text-slate-100 border-slate-800"}`} />
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(aiResult); showToast(t.copiedResult); } catch { } }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">{t.copyResult}</button>
              <button type="button" onClick={() => updateText(aiResult, t.mainTextReplaced)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">{t.replaceText}</button>
            </div>
          </div>
        )}

        {/* AI Инструменти + Custom Prompt */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? "bg-blue-50/40 border-blue-100" : "bg-slate-900/50 border-slate-800"}`}>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t.aiTools}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <TooltipButton onClick={() => handleAiAction("summary")} text={t.aiSummary} tip={t.tips.aiSummary} isAi isLoading={loadingAction === "summary"} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => handleAiAction("fix")} text={t.aiFix} tip={t.tips.aiFix} isAi isLoading={loadingAction === "fix"} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => handleAiAction("expand")} text={t.aiExpand} tip={t.tips.aiExpand} isAi isLoading={loadingAction === "expand"} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => handleAiAction("shorten")} text={t.aiShorten} tip={t.tips.aiShorten} isAi isLoading={loadingAction === "shorten"} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => handleAiAction("simplify")} text={t.aiSimplify} tip={t.tips.aiSimplify} isAi isLoading={loadingAction === "simplify"} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => handleAiAction("elevate")} text={t.aiElevate} tip={t.tips.aiElevate} isAi isLoading={loadingAction === "elevate"} isLight={isLight} processingText={t.processing} />
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200/50 dark:border-slate-700/50">
             <input type="text" placeholder={t.aiCustomPlaceholder} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className={`flex-1 border px-3 py-2 text-xs rounded-lg outline-none focus:border-blue-500 ${isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"}`} />
             <button type="button" onClick={() => handleAiAction("custom", customPrompt)} disabled={!customPrompt || loadingAction === "custom"} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50">{t.aiCustomBtn}</button>
          </div>
        </div>

        {/* Търсене & Замяна */}
        <div className={`p-4 rounded-xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.searchReplace}</div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder={t.findPlaceholder} value={findVal} onChange={(e) => setFindVal(e.target.value)} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"}`} />
            <input type="text" placeholder={t.replacePlaceholder} value={replaceVal} onChange={(e) => setReplaceVal(e.target.value)} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"}`} />
            <button type="button" onClick={handleReplace} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">{t.replaceBtn}</button>
          </div>
        </div>

        {/* Превод */}
        <div className={`p-4 rounded-xl border space-y-3 ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.transEngine}</div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <label htmlFor="trans-engine">{t.engineLabel}</label>
              <select id="trans-engine" value={engine} onChange={(e) => setEngine(e.target.value)} className={`border text-xs px-2 py-1 rounded-md outline-none ${isLight ? "bg-slate-50 border-slate-300 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}>
                <option value="google">Google Translate</option><option value="mymemory">MyMemory</option><option value="lingva">Lingva</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[{ src: "bg", tgt: "en", label: t.transEn }, { src: "en", tgt: "bg", label: t.transBg }, { src: "auto", tgt: "de", label: t.transDe }, { src: "auto", tgt: "fr", label: t.transFr }].map((btn, idx) => (
              <button type="button" key={idx} onClick={() => translateText(btn.src, btn.tgt)} className={`border py-2 rounded-lg text-xs font-semibold transition-all ${isLight ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50"}`}>{btn.label}</button>
            ))}
          </div>
        </div>

        {/* Транслитерация */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.translit}</div>
          <div className="grid grid-cols-2 gap-2">
            <TooltipButton onClick={toLatin} text={t.cyrToLat} tip={t.tips.toLatin} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={toCyrillic} text={t.latToCyr} tip={t.tips.toCyrillic} isLight={isLight} processingText={t.processing} />
          </div>
        </div>

        {/* Почистване (в падащо меню за по-чист дизайн) */}
        <details className={`group border rounded-2xl transition-all ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"}`}>
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.tools}</div>
            <span className="transition group-open:rotate-180 text-slate-400">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <TooltipButton onClick={makeBIG} text={t.uppercase} tip={t.tips.uppercase} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={makeSmall} text={t.lowercase} tip={t.tips.lowercase} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={capitalizeSentences} text={t.sentenceCase} tip={t.tips.sentenceCase} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={capitalizeTitleCase} text={t.titleCase} tip={t.tips.titleCase} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={makeSlug} text={t.slug} tip={t.tips.slug} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={stripHtmlTags} text={t.stripHtml} tip={t.tips.stripHtml} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={removeSpaces} text={t.removeSpaces} tip={t.tips.removeSpaces} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={removeDuplicateLines} text={t.removeDuplicates} tip={t.tips.removeDuplicateLines} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={removeEmptyLines} text={t.removeEmpty} tip={t.tips.removeEmptyLines} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={sortLinesAsc} text={t.sortLinesAsc} tip={t.tips.sortLinesAsc} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={sortLinesDesc} text={t.sortLinesDesc} tip={t.tips.sortLinesDesc} isLight={isLight} processingText={t.processing} />
            <button type="button" onClick={clearAll} className={`border-0 text-xs py-2.5 rounded-lg transition-all font-semibold ${isLight ? "bg-rose-50 hover:bg-rose-100 text-rose-700" : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300"}`}>{t.clearAll}</button>
          </div>
        </details>

        {/* PRO Инструменти (в падащо меню) */}
        <details className={`group border rounded-2xl transition-all ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"}`}>
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.proTools}</div>
            <span className="transition group-open:rotate-180 text-slate-400">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TooltipButton onClick={encodeBase64} text={t.encodeBase64} tip={t.tips.encodeBase64} isPro isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={decodeBase64} text={t.decodeBase64} tip={t.tips.decodeBase64} isPro isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={formatJSON} text={t.formatJSON} tip={t.tips.formatJSON} isPro isLight={isLight} processingText={t.processing} />
          </div>
        </details>

        {/* Футър */}
        <footer className={`pt-8 border-t text-center text-xs text-slate-500 space-y-3 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div>TextFix Pro &copy; 2026</div>
          <div>
            <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" className={`inline-block border px-4 py-2 rounded-full font-medium transition-all ${isLight ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100" : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"}`}>{t.buyCoffee} ☕</a>
          </div>
        </footer>
      </div>

      {toastMsg && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl transition-all animate-bounce z-50">{toastMsg}</div>
      )}
    </main>
  );
}