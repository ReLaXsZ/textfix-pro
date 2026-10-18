"use client";

import ShareButtons from "./ShareButtons";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import mammoth from "mammoth";

type Language = "bg" | "en" | "fr" | "de";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const HISTORY_DEBOUNCE_MS = 500;
const SESSION_SAVE_DEBOUNCE_MS = 3000;

// ─── ПРЕВОДИ ────────────────────────────────────────────────────────────────
const translations = {
  bg: {
    title: "TextFix Pro",
    subtitle: "Интелигентен текстов помощник & Редактор v2.1",
    chars: "Символа",
    noSpaces: "Без интервали",
    words: "Думи",
    lines: "Редове",
    paragraphs: "Абзаци",
    readTime: "Време за четене",
    readTimeValue: (n: number) => `${n} мин`,
    upload: "📁 Качете файл (.txt, .md, .json, .docx)",
    uploadSub:
      "Поддържа автоматично извличане на текст от Word, Markdown и текстов формат (макс. 10 MB)",
    undo: "↩️ Назад",
    redo: "↪️ Напред",
    copy: "📋 Копирай",
    downloadTxt: "💾 Изтегли .txt",
    downloadDocx: "📄 Изтегли .docx (Word)",
    placeholder: "Въведете или поставете вашия текст тук...",
    aiTools: "🤖 Интелигентни AI инструменти",
    aiSummary: "✨ AI Резюме",
    aiFix: "📝 AI Поправи граматиката",
    aiExpand: "🚀 AI Разшири текста",
    aiShorten: "📉 AI Скъси текста",
    aiSimplify: "🧸 AI Опрости нивото",
    aiElevate: "🎓 AI Повиши нивото",
    aiResultTitle: "🤖 Интелигентен резултат:",
    copyResult: "📋 Копирай резултата",
    replaceText: "🔄 Замени главния текст",
    closeResult: "❌ Затвори",
    processing: "Обработва се...",
    voiceInput: "🎤 Гласов вход (Диктуване)",
    voiceStop: "⏹️ Спри диктуването",
    speakText: "🔊 Прочети на глас",
    speakStop: "🔇 Спри четенето",
    voiceListeningMsg: "🎙️ Записването е активно... Говорете на микрофона",
    voiceSpeakingMsg: "🔊 Прочитане на съдържанието на глас...",
    wordFreqTitle: "📊 Анализ на повторенията (Честота на думите):",
    wordFreqTip:
      "Показва най-често използваните значими думи. Използвайте го, за да избегнете тавтология.",
    historyTitle: "💾 Запазени сесии (Локална памет):",
    historyTip:
      "Текстът се запазва автоматично в браузъра ви. Данните не се изпращат на външни сървъри.",
    historyRestore: "Възстанови",
    historyClear: "Изчисти историята",
    markdownTitle: "✍️ Бързо форматиране (Markdown):",
    previewTitle: "👁️ Преглед",
    editorTitle: "✏️ Редактор",
    noTextPreview: "Няма въведен текст за преглед.",
    searchReplace: "🔍 Търсене & Замяна",
    findPlaceholder: "Търси дума...",
    replacePlaceholder: "Замени с...",
    replaceBtn: "Замени всички",
    transEngine: "🌐 Превод на езици",
    engineLabel: "Изберете услуга:",
    transEn: "Преведи на Английски 🇬🇧",
    transBg: "Преведи на Български 🇧🇬",
    transDe: "Преведи на Немски 🇩🇪",
    transFr: "Преведи на Френски 🇫🇷",
    translit: "🔠 Смяна на азбуката (Транслитерация)",
    cyrToLat: "Кирилица ➔ Латиница",
    latToCyr: "Латиница ➔ Кирилица",
    tools: "🛠️ Почистване и Форматиране",
    uppercase: "ГОЛЕМИ БУКВИ",
    lowercase: "малки букви",
    sentenceCase: "✏️ Главна буква на изречение",
    titleCase: "🔠 Заглавни букви",
    slug: "🔗 Уеб линк (Slug)",
    stripHtml: "🧹 Изчисти HTML кодове",
    removeSpaces: "Премахни излишни интервали",
    removeDuplicates: "Премахни повтарящи се редове",
    removeEmpty: "Премахни празни редове",
    sortLines: "Сортирай редовете (А-Я)",
    clearAll: "Изчисти всичко",
    proTools: "⚡ PRO Инструменти за напреднали",
    encodeBase64: "🔐 Base64 Кодиране",
    decodeBase64: "🔓 Base64 Декодиране",
    formatJSON: "📦 Форматирай JSON",
    buyCoffee: "☕ Купи ми кафе",
    lightTheme: "☀️ Светъл режим",
    darkTheme: "🌙 Тъмен режим",
    // Съобщения
    fileTooLarge: "Файлът е твърде голям (макс. 10 MB).",
    fileLoaded: (name: string) => `Файлът "${name}" е зареден!`,
    wordFileLoading: "Зареждане на Word файл...",
    wordFileLoaded: "Word документът е зареден успешно!",
    wordFileFallback: "Word документът е зареден, но текстът не можа да бъде извлечен.",
    wordLoadError: "Грешка при четене на .docx файла.",
    noTextToDownload: "Няма текст за изтегляне!",
    noTextToCopy: "Няма текст за копиране!",
    noTextToSpeak: "Въведете текст за прочитане!",
    noTextForAi: "Моля, въведете текст за анализ!",
    noFindWord: "Моля, въведете дума за търсене!",
    noMatches: "Не бяха намерени съвпадения.",
    noTextToTranslate: "Моля, въведете текст за превод!",
    aiError: "Грешка при обработката от асистента.",
    aiConnectionError: "Грешка при връзката със сървъра.",
    translateError: "Грешка при връзката с преводача.",
    translateNoResult: "Опитайте с друг преводач от менюто.",
    invalidBase64: "Невалиден Base64 формат.",
    invalidJson: "Невалиден JSON формат.",
    encodeError: "Грешка при кодирането.",
    speechNotSupported: "Вашият браузър не поддържа гласов вход.",
    ttsNotSupported: "Вашият браузър не поддържа прочитане на глас.",
    microphoneDenied:
      "Моля, разрешете достъпа до микрофона в настройките на браузъра.",
    listeningError: "Грешка при стартиране на гласовия вход.",
    speaking: "Прочитане на текста...",
    speakingStopped: "Четенето е спряно.",
    listeningStopped: "Гласовият вход е спрян.",
    micActive: "Микрофонът е активен! Започнете да говорите...",
    copied: "Текстът е копиран успешно!",
    copiedResult: "Резултатът е копиран!",
    downloaded: "Файлът е изтеглен!",
    downloadedDocx: "Word файлът е изтеглен успешно!",
    replaced: (n: number) => `Заменени ${n} места!`,
    resultReady: "Резултатът е готов!",
    mainTextReplaced: "Главният текст е заменен с новия резултат!",
    textRestored: "Текстът бе възстановен!",
    translitSuccess: "Транслитерацията е успешна!",
    upperSuccess: "ГОЛЕМИ БУКВИ!",
    lowerSuccess: "малки букви!",
    sentenceSuccess: "Главни букви на изреченията!",
    titleSuccess: "Заглавни букви!",
    slugSuccess: "Генериран уеб линк!",
    htmlStripped: "HTML таговете са премахнати!",
    spacesRemoved: "Излишните интервали са премахнати!",
    duplicatesRemoved: "Дублиращите се редове са премахнати!",
    emptyRemoved: "Празните редове са премахнати!",
    sorted: "Редовете са подредени (А-Я)!",
    cleared: "Всичко е изчистено!",
    encodeSuccess: "Base64 кодиране успешно!",
    decodeSuccess: "Base64 декодиране успешно!",
    jsonFormatted: "JSON форматиран успешно!",
    translating: "Превежда се... моля изчакайте",
    translationReady: "Преводът е готов!",
    // Tips
    tips: {
      aiSummary: "Използва изкуствен интелект за съставяне на кратко резюме",
      aiFix:
        "Автоматично коригира правописни, граматични и пунктуационни грешки",
      aiExpand: "Развива идеите ви в по-подробен и структуриран текст",
      aiShorten: "Съкращава съдържанието, запазвайки основните акценти",
      aiSimplify: "Пренаписва текста на достъпен и елементарен език",
      aiElevate: "Пренаписва текста в по-професионален и официален стил",
      voiceInput:
        "Кликнете за стартиране на гласовия вход. Уверете се, че микрофонът е разрешен в браузъра.",
      speakText:
        "Прочита целия текст с синтезиран глас на избрания език.",
      toLatin: "Преобразува български букви в латински съответствия",
      toCyrillic: "Преобразува латински текст в кирилица по умни правила",
      uppercase: "Преобразува всички букви в главни",
      lowercase: "Преобразува всички букви в малки",
      sentenceCase: "Прави първата буква на всяко изречение главна",
      titleCase: "Прави първата буква на всяка дума главна",
      slug: "Превръща текст в чист URL адрес на латиница",
      stripHtml: "Премахва скрити HTML тагове и форматиране",
      removeSpaces: "Премахва излишните празни места и табулации",
      removeDuplicateLines: "Изтрива напълно дублиращите се редове",
      removeEmptyLines: "Премахва празните редове в текста",
      sortLines: "Сортира всички редове по азбучен ред",
      encodeBase64: "Кодира текста в зашифрован Base64 формат",
      decodeBase64: "Декодира Base64 обратно в нормален текст",
      formatJSON: "Форматира и подрежда JSON структури с отстъпи",
    },
  },
  en: {
    title: "TextFix Pro",
    subtitle: "Intelligent Text Assistant & Editor v2.1",
    chars: "Characters",
    noSpaces: "No spaces",
    words: "Words",
    lines: "Lines",
    paragraphs: "Paragraphs",
    readTime: "Reading time",
    readTimeValue: (n: number) => `${n} min`,
    upload: "📁 Upload file (.txt, .md, .json, .docx)",
    uploadSub:
      "Supports text extraction from Word, Markdown, and plain text files (max 10 MB)",
    undo: "↩️ Undo",
    redo: "↪️ Redo",
    copy: "📋 Copy",
    downloadTxt: "💾 Download .txt",
    downloadDocx: "📄 Download .docx (Word)",
    placeholder: "Type or paste your text here...",
    aiTools: "🤖 Intelligent AI Tools",
    aiSummary: "✨ AI Summary",
    aiFix: "📝 AI Fix Grammar",
    aiExpand: "🚀 AI Expand Text",
    aiShorten: "📉 AI Shorten",
    aiSimplify: "🧸 AI Simplify",
    aiElevate: "🎓 AI Elevate Style",
    aiResultTitle: "🤖 Intelligent Result:",
    copyResult: "📋 Copy Result",
    replaceText: "🔄 Replace Main Text",
    closeResult: "❌ Close",
    processing: "Processing...",
    voiceInput: "🎤 Voice Input (Dictate)",
    voiceStop: "⏹️ Stop Dictation",
    speakText: "🔊 Read Aloud",
    speakStop: "🔇 Stop Reading",
    voiceListeningMsg: "🎙️ Recording active... Speak into the microphone",
    voiceSpeakingMsg: "🔊 Reading content aloud...",
    wordFreqTitle: "📊 Word Frequency Analysis:",
    wordFreqTip:
      "Shows top used significant words to help avoid repetition.",
    historyTitle: "💾 Saved Sessions (Local Storage):",
    historyTip:
      "Text is saved automatically in your browser. No data is sent to external servers.",
    historyRestore: "Restore",
    historyClear: "Clear History",
    markdownTitle: "✍️ Quick Formatting (Markdown):",
    previewTitle: "👁️ Preview",
    editorTitle: "✏️ Editor",
    noTextPreview: "No text to preview.",
    searchReplace: "🔍 Search & Replace",
    findPlaceholder: "Find word...",
    replacePlaceholder: "Replace with...",
    replaceBtn: "Replace All",
    transEngine: "🌐 Translation Engines",
    engineLabel: "Select service:",
    transEn: "Translate to English 🇬🇧",
    transBg: "Translate to Bulgarian 🇧🇬",
    transDe: "Translate to German 🇩🇪",
    transFr: "Translate to French 🇫🇷",
    translit: "🔠 Transliteration",
    cyrToLat: "Cyrillic ➔ Latin",
    latToCyr: "Latin ➔ Cyrillic",
    tools: "🛠️ Cleaning & Formatting",
    uppercase: "UPPERCASE",
    lowercase: "lowercase",
    sentenceCase: "✏️ Sentence case",
    titleCase: "🔠 Title Case",
    slug: "🔗 Web Slug",
    stripHtml: "🧹 Strip HTML tags",
    removeSpaces: "Remove extra spaces",
    removeDuplicates: "Remove duplicate lines",
    removeEmpty: "Remove empty lines",
    sortLines: "Sort lines (A-Z)",
    clearAll: "Clear All",
    proTools: "⚡ PRO Advanced Tools",
    encodeBase64: "🔐 Base64 Encode",
    decodeBase64: "🔓 Base64 Decode",
    formatJSON: "📦 Format JSON",
    buyCoffee: "☕ Buy me a coffee",
    lightTheme: "☀️ Light Theme",
    darkTheme: "🌙 Dark Theme",
    fileTooLarge: "File is too large (max 10 MB).",
    fileLoaded: (name: string) => `File "${name}" loaded!`,
    wordFileLoading: "Loading Word file...",
    wordFileLoaded: "Word document loaded successfully!",
    wordFileFallback:
      "Word document loaded, but text could not be extracted.",
    wordLoadError: "Error reading .docx file.",
    noTextToDownload: "No text to download!",
    noTextToCopy: "No text to copy!",
    noTextToSpeak: "Enter text to read aloud!",
    noTextForAi: "Please enter text for analysis!",
    noFindWord: "Please enter a word to find!",
    noMatches: "No matches found.",
    noTextToTranslate: "Please enter text to translate!",
    aiError: "Error processing with the assistant.",
    aiConnectionError: "Error connecting to the server.",
    translateError: "Error connecting to the translator.",
    translateNoResult: "Try another translator from the menu.",
    invalidBase64: "Invalid Base64 format.",
    invalidJson: "Invalid JSON format.",
    encodeError: "Encoding error.",
    speechNotSupported: "Your browser does not support voice input.",
    ttsNotSupported: "Your browser does not support text-to-speech.",
    microphoneDenied: "Please allow microphone access in browser settings.",
    listeningError: "Error starting voice input.",
    speaking: "Reading text aloud...",
    speakingStopped: "Reading stopped.",
    listeningStopped: "Voice input stopped.",
    micActive: "Microphone active! Start speaking...",
    copied: "Text copied successfully!",
    copiedResult: "Result copied!",
    downloaded: "File downloaded!",
    downloadedDocx: "Word file downloaded successfully!",
    replaced: (n: number) => `Replaced ${n} occurrence(s)!`,
    resultReady: "Result is ready!",
    mainTextReplaced: "Main text replaced with the new result!",
    textRestored: "Text restored!",
    translitSuccess: "Transliteration successful!",
    upperSuccess: "UPPERCASE!",
    lowerSuccess: "lowercase!",
    sentenceSuccess: "Sentence case applied!",
    titleSuccess: "Title Case applied!",
    slugSuccess: "Web slug generated!",
    htmlStripped: "HTML tags removed!",
    spacesRemoved: "Extra spaces removed!",
    duplicatesRemoved: "Duplicate lines removed!",
    emptyRemoved: "Empty lines removed!",
    sorted: "Lines sorted (A-Z)!",
    cleared: "Everything cleared!",
    encodeSuccess: "Base64 encoding successful!",
    decodeSuccess: "Base64 decoding successful!",
    jsonFormatted: "JSON formatted successfully!",
    translating: "Translating... please wait",
    translationReady: "Translation ready!",
    tips: {
      aiSummary: "Uses AI to create a concise summary",
      aiFix: "Fixes grammar, spelling, and style errors automatically",
      aiExpand: "Expands your points into detailed text",
      aiShorten: "Shortens content while keeping key ideas",
      aiSimplify: "Rewrites text in simple and clear words",
      aiElevate: "Rewrites text in a refined, professional tone",
      voiceInput:
        "Click to dictate via microphone. Make sure microphone access is allowed.",
      speakText: "Reads the entire text aloud using Speech Synthesis.",
      toLatin: "Converts Cyrillic characters to Latin letters",
      toCyrillic: "Converts Latin letters to Cyrillic",
      uppercase: "Converts all letters to uppercase",
      lowercase: "Converts all letters to lowercase",
      sentenceCase: "Capitalizes the first letter of each sentence",
      titleCase: "Capitalizes the first letter of every word",
      slug: "Transforms text into a clean URL slug",
      stripHtml: "Removes hidden HTML tags",
      removeSpaces: "Cleans up extra empty spaces",
      removeDuplicateLines: "Deletes duplicate lines completely",
      removeEmptyLines: "Removes blank lines",
      sortLines: "Sorts text lines alphabetically",
      encodeBase64: "Encodes text into Base64 format",
      decodeBase64: "Decodes Base64 text back",
      formatJSON: "Formats JSON code with proper spacing",
    },
  },
  fr: {
    title: "TextFix Pro",
    subtitle: "Assistant textuel intelligent v2.1",
    chars: "Caractères",
    noSpaces: "Sans espaces",
    words: "Mots",
    lines: "Lignes",
    paragraphs: "Paragraphes",
    readTime: "Temps de lecture",
    readTimeValue: (n: number) => `${n} min`,
    upload: "📁 Charger un fichier (.txt, .md, .json, .docx)",
    uploadSub:
      "Extraction automatique de texte Word, Markdown et fichier texte (max 10 Mo)",
    undo: "↩️ Annuler",
    redo: "↪️ Rétablir",
    copy: "📋 Copier",
    downloadTxt: "💾 Télécharger .txt",
    downloadDocx: "📄 Télécharger .docx (Word)",
    placeholder: "Saisissez ou collez votre texte ici...",
    aiTools: "🤖 Outils IA Intelligents",
    aiSummary: "✨ Résumé IA",
    aiFix: "📝 Corriger la grammaire",
    aiExpand: "🚀 Développer le texte",
    aiShorten: "📉 Raccourcir",
    aiSimplify: "🧸 Simplifier",
    aiElevate: "🎓 Élever le style",
    aiResultTitle: "🤖 Résultat Intelligent :",
    copyResult: "📋 Copier le résultat",
    replaceText: "🔄 Remplacer le texte",
    closeResult: "❌ Fermer",
    processing: "Traitement en cours...",
    voiceInput: "🎤 Saisie vocale",
    voiceStop: "⏹️ Arrêter la dictée",
    speakText: "🔊 Lire à haute voix",
    speakStop: "🔇 Arrêter la lecture",
    voiceListeningMsg: "🎙️ Enregistrement actif... Parlez clairement",
    voiceSpeakingMsg: "🔊 Lecture du contenu...",
    wordFreqTitle: "📊 Analyse de fréquence des mots :",
    wordFreqTip:
      "Affiche les mots les plus utilisés pour éviter les répétitions.",
    historyTitle: "💾 Historique enregistré :",
    historyTip:
      "Sauvegarde automatique dans le navigateur. Aucune donnée envoyée au serveur.",
    historyRestore: "Restaurer",
    historyClear: "Effacer l'historique",
    markdownTitle: "✍️ Formatage rapide (Markdown) :",
    previewTitle: "👁️ Aperçu",
    editorTitle: "✏️ Éditeur",
    noTextPreview: "Aucun texte à prévisualiser.",
    searchReplace: "🔍 Rechercher et Remplacer",
    findPlaceholder: "Rechercher...",
    replacePlaceholder: "Remplacer par...",
    replaceBtn: "Tout remplacer",
    transEngine: "🌐 Moteur de Traduction",
    engineLabel: "Sélectionnez un service :",
    transEn: "Traduire en Anglais 🇬🇧",
    transBg: "Traduire en Bulgare 🇧🇬",
    transDe: "Traduire en Allemand 🇩🇪",
    transFr: "Traduire en Français 🇫🇷",
    translit: "🔠 Translittération",
    cyrToLat: "Cyrillique ➔ Latin",
    latToCyr: "Latin ➔ Cyrillique",
    tools: "🛠️ Nettoyage & Formatage",
    uppercase: "MAJUSCULES",
    lowercase: "minuscules",
    sentenceCase: "✏️ Majuscule en début de phrase",
    titleCase: "🔠 Cas de Titre",
    slug: "🔗 Slug Web",
    stripHtml: "🧹 Supprimer balises HTML",
    removeSpaces: "Supprimer espaces superflus",
    removeDuplicates: "Supprimer lignes en double",
    removeEmpty: "Supprimer lignes vides",
    sortLines: "Trier lignes (A-Z)",
    clearAll: "Tout effacer",
    proTools: "⚡ Outils Avancés PRO",
    encodeBase64: "🔐 Encodage Base64",
    decodeBase64: "🔓 Décodage Base64",
    formatJSON: "📦 Formater JSON",
    buyCoffee: "☕ Offrez-moi un café",
    lightTheme: "☀️ Mode Clair",
    darkTheme: "🌙 Mode Sombre",
    fileTooLarge: "Fichier trop volumineux (max 10 Mo).",
    fileLoaded: (name: string) => `Fichier "${name}" chargé !`,
    wordFileLoading: "Chargement du fichier Word...",
    wordFileLoaded: "Document Word chargé avec succès !",
    wordFileFallback:
      "Document Word chargé, mais le texte n'a pas pu être extrait.",
    wordLoadError: "Erreur de lecture du fichier .docx.",
    noTextToDownload: "Aucun texte à télécharger !",
    noTextToCopy: "Aucun texte à copier !",
    noTextToSpeak: "Saisissez du texte à lire !",
    noTextForAi: "Veuillez saisir du texte pour analyse !",
    noFindWord: "Veuillez saisir un mot à rechercher !",
    noMatches: "Aucune correspondance trouvée.",
    noTextToTranslate: "Veuillez saisir du texte à traduire !",
    aiError: "Erreur de traitement avec l'assistant.",
    aiConnectionError: "Erreur de connexion au serveur.",
    translateError: "Erreur de connexion au traducteur.",
    translateNoResult: "Essayez un autre traducteur.",
    invalidBase64: "Format Base64 invalide.",
    invalidJson: "Format JSON invalide.",
    encodeError: "Erreur d'encodage.",
    speechNotSupported: "Votre navigateur ne prend pas en charge la saisie vocale.",
    ttsNotSupported: "Votre navigateur ne prend pas en charge la synthèse vocale.",
    microphoneDenied: "Veuillez autoriser l'accès au microphone dans les paramètres du navigateur.",
    listeningError: "Erreur lors du démarrage de la saisie vocale.",
    speaking: "Lecture du texte...",
    speakingStopped: "Lecture arrêtée.",
    listeningStopped: "Saisie vocale arrêtée.",
    micActive: "Microphone actif ! Commencez à parler...",
    copied: "Texte copié avec succès !",
    copiedResult: "Résultat copié !",
    downloaded: "Fichier téléchargé !",
    downloadedDocx: "Fichier Word téléchargé avec succès !",
    replaced: (n: number) => `${n} occurrence(s) remplacée(s) !`,
    resultReady: "Le résultat est prêt !",
    mainTextReplaced: "Texte principal remplacé par le nouveau résultat !",
    textRestored: "Texte restauré !",
    translitSuccess: "Translittération réussie !",
    upperSuccess: "MAJUSCULES !",
    lowerSuccess: "minuscules !",
    sentenceSuccess: "Majuscule en début de phrase !",
    titleSuccess: "Cas de Titre appliqué !",
    slugSuccess: "Slug Web généré !",
    htmlStripped: "Balises HTML supprimées !",
    spacesRemoved: "Espaces superflus supprimés !",
    duplicatesRemoved: "Lignes en double supprimées !",
    emptyRemoved: "Lignes vides supprimées !",
    sorted: "Lignes triées (A-Z) !",
    cleared: "Tout effacé !",
    encodeSuccess: "Encodage Base64 réussi !",
    decodeSuccess: "Décodage Base64 réussi !",
    jsonFormatted: "JSON formaté avec succès !",
    translating: "Traduction en cours... veuillez patienter",
    translationReady: "Traduction prête !",
    tips: {
      aiSummary: "Utilise l'IA pour créer un résumé concis",
      aiFix: "Corrige la grammaire et le style automatiquement",
      aiExpand: "Développe vos idées",
      aiShorten: "Raccourcit le texte",
      aiSimplify: "Rend le texte plus simple",
      aiElevate: "Améliore le niveau de langue",
      voiceInput: "Dictez via le micro. Autorisez l'accès au micro.",
      speakText: "Lit le texte à haute voix.",
      toLatin: "Convertit le cyrillique en latin",
      toCyrillic: "Convertit le latin en cyrillique",
      uppercase: "Met en majuscules",
      lowercase: "Met en minuscules",
      sentenceCase: "Majuscule au début des phrases",
      titleCase: "Majuscule à chaque mot",
      slug: "Crée un slug URL propre",
      stripHtml: "Supprime le HTML",
      removeSpaces: "Nettoie les espaces",
      removeDuplicateLines: "Supprime les doublons",
      removeEmptyLines: "Supprime les lignes vides",
      sortLines: "Trie les lignes",
      encodeBase64: "Encode en Base64",
      decodeBase64: "Décode le Base64",
      formatJSON: "Formate le JSON",
    },
  },
  de: {
    title: "TextFix Pro",
    subtitle: "Intelligenter Textassistent v2.1",
    chars: "Zeichen",
    noSpaces: "Ohne Leerzeichen",
    words: "Wörter",
    lines: "Zeilen",
    paragraphs: "Absätze",
    readTime: "Lesezeit",
    readTimeValue: (n: number) => `${n} Min.`,
    upload: "📁 Datei hochladen (.txt, .md, .json, .docx)",
    uploadSub:
      "Automatische Textextraktion aus Word und Textdateien (max. 10 MB)",
    undo: "↩️ Rückgängig",
    redo: "↪️ Wiederholen",
    copy: "📋 Kopieren",
    downloadTxt: "💾 .txt herunterladen",
    downloadDocx: "📄 .docx (Word) herunterladen",
    placeholder: "Geben Sie Ihren Text hier ein oder fügen Sie ihn ein...",
    aiTools: "🤖 Intelligente KI-Werkzeuge",
    aiSummary: "✨ KI Zusammenfassung",
    aiFix: "📝 KI Grammatik korrigieren",
    aiExpand: "🚀 KI Text erweitern",
    aiShorten: "📉 KI Text kürzen",
    aiSimplify: "🧸 KI Vereinfachen",
    aiElevate: "🎓 KI Niveau erhöhen",
    aiResultTitle: "🤖 Intelligentes Ergebnis:",
    copyResult: "📋 Ergebnis kopieren",
    replaceText: "🔄 Text ersetzen",
    closeResult: "❌ Schließen",
    processing: "Wird verarbeitet...",
    voiceInput: "🎤 Spracheingabe",
    voiceStop: "⏹️ Diktieren beenden",
    speakText: "🔊 Vorlesen",
    speakStop: "🔇 Vorlesen beenden",
    voiceListeningMsg: "🎙️ Aufnahme aktiv... Bitte deutlich sprechen",
    voiceSpeakingMsg: "🔊 Inhalt wird vorgelesen...",
    wordFreqTitle: "📊 Worthäufigkeitsanalyse:",
    wordFreqTip:
      "Zeigt oft genutzte Wörter zur Vermeidung von Wiederholungen.",
    historyTitle: "💾 Gespeicherter Verlauf:",
    historyTip:
      "Automatische Speicherung im Browser. Keine Serverübertragung.",
    historyRestore: "Wiederherstellen",
    historyClear: "Verlauf löschen",
    markdownTitle: "✍️ Schnelle Formatierung (Markdown):",
    previewTitle: "👁️ Vorschau",
    editorTitle: "✏️ Editor",
    noTextPreview: "Kein Text zur Vorschau.",
    searchReplace: "🔍 Suchen & Ersetzen",
    findPlaceholder: "Wort suchen...",
    replacePlaceholder: "Ersetzen durch...",
    replaceBtn: "Alle ersetzen",
    transEngine: "🌐 Übersetzungsdienst",
    engineLabel: "Dienst auswählen:",
    transEn: "Ins Englische übersetzen 🇬🇧",
    transBg: "Ins Bulgarische übersetzen 🇧🇬",
    transDe: "Ins Deutsche übersetzen 🇩🇪",
    transFr: "Ins Französische übersetzen 🇫🇷",
    translit: "🔠 Transliteration",
    cyrToLat: "Kyrillisch ➔ Lateinisch",
    latToCyr: "Lateinisch ➔ Kyrillisch",
    tools: "🛠️ Bereinigung & Formatierung",
    uppercase: "GROSSBUCHSTABEN",
    lowercase: "kleinbuchstaben",
    sentenceCase: "✏️ Satzanfang groß",
    titleCase: "🔠 Wortanfänge Groß",
    slug: "🔗 Web-Slug",
    stripHtml: "🧹 HTML-Tags entfernen",
    removeSpaces: "Extra Leerzeichen entfernen",
    removeDuplicates: "Doppelte Zeilen entfernen",
    removeEmpty: "Leere Zeilen entfernen",
    sortLines: "Zeilen sortieren (A-Z)",
    clearAll: "Alles löschen",
    proTools: "⚡ PRO Erweiterte Werkzeuge",
    encodeBase64: "🔐 Base64 Kodieren",
    decodeBase64: "🔓 Base64 Dekodieren",
    formatJSON: "📦 JSON Formatieren",
    buyCoffee: "☕ Spendier mir einen Kaffee",
    lightTheme: "☀️ Helles Design",
    darkTheme: "🌙 Dunkles Design",
    fileTooLarge: "Datei zu groß (max. 10 MB).",
    fileLoaded: (name: string) => `Datei "${name}" geladen!`,
    wordFileLoading: "Word-Datei wird geladen...",
    wordFileLoaded: "Word-Dokument erfolgreich geladen!",
    wordFileFallback:
      "Word-Dokument geladen, aber Text konnte nicht extrahiert werden.",
    wordLoadError: "Fehler beim Lesen der .docx-Datei.",
    noTextToDownload: "Kein Text zum Herunterladen!",
    noTextToCopy: "Kein Text zum Kopieren!",
    noTextToSpeak: "Geben Sie Text zum Vorlesen ein!",
    noTextForAi: "Bitte Text zur Analyse eingeben!",
    noFindWord: "Bitte ein Suchwort eingeben!",
    noMatches: "Keine Treffer gefunden.",
    noTextToTranslate: "Bitte Text zum Übersetzen eingeben!",
    aiError: "Fehler bei der Verarbeitung.",
    aiConnectionError: "Fehler bei der Serververbindung.",
    translateError: "Fehler bei der Verbindung zum Übersetzer.",
    translateNoResult: "Versuchen Sie einen anderen Übersetzer.",
    invalidBase64: "Ungültiges Base64-Format.",
    invalidJson: "Ungültiges JSON-Format.",
    encodeError: "Kodierungsfehler.",
    speechNotSupported: "Ihr Browser unterstützt keine Spracheingabe.",
    ttsNotSupported: "Ihr Browser unterstützt kein Vorlesen.",
    microphoneDenied:
      "Bitte erlauben Sie den Mikrofonzugriff in den Browsereinstellungen.",
    listeningError: "Fehler beim Starten der Spracheingabe.",
    speaking: "Text wird vorgelesen...",
    speakingStopped: "Vorlesen beendet.",
    listeningStopped: "Spracheingabe beendet.",
    micActive: "Mikrofon aktiv! Beginnen Sie zu sprechen...",
    copied: "Text erfolgreich kopiert!",
    copiedResult: "Ergebnis kopiert!",
    downloaded: "Datei heruntergeladen!",
    downloadedDocx: "Word-Datei erfolgreich heruntergeladen!",
    replaced: (n: number) => `${n} Vorkommen ersetzt!`,
    resultReady: "Ergebnis ist bereit!",
    mainTextReplaced: "Haupttext durch neues Ergebnis ersetzt!",
    textRestored: "Text wiederhergestellt!",
    translitSuccess: "Transliteration erfolgreich!",
    upperSuccess: "GROSSBUCHSTABEN!",
    lowerSuccess: "kleinbuchstaben!",
    sentenceSuccess: "Satzanfang groß!",
    titleSuccess: "Wortanfänge groß!",
    slugSuccess: "Web-Slug generiert!",
    htmlStripped: "HTML-Tags entfernt!",
    spacesRemoved: "Extra Leerzeichen entfernt!",
    duplicatesRemoved: "Doppelte Zeilen entfernt!",
    emptyRemoved: "Leere Zeilen entfernt!",
    sorted: "Zeilen sortiert (A-Z)!",
    cleared: "Alles gelöscht!",
    encodeSuccess: "Base64-Kodierung erfolgreich!",
    decodeSuccess: "Base64-Dekodierung erfolgreich!",
    jsonFormatted: "JSON erfolgreich formatiert!",
    translating: "Übersetzung läuft... bitte warten",
    translationReady: "Übersetzung fertig!",
    tips: {
      aiSummary: "Verwendet KI zur Zusammenfassung",
      aiFix: "Korrigiert Grammatik automatisch",
      aiExpand: "Erweitert Ideen",
      aiShorten: "Kürzt den Text",
      aiSimplify: "Vereinfacht die Sprache",
      aiElevate: "Hebt das Niveau",
      voiceInput: "Über Mikrofon diktieren.",
      speakText: "Liest den Text laut vor.",
      toLatin: "Kyrillisch zu Latein",
      toCyrillic: "Latein zu Kyrillisch",
      uppercase: "In Großbuchstaben",
      lowercase: "In Kleinbuchstaben",
      sentenceCase: "Satzanfang groß",
      titleCase: "Wortanfänge groß",
      slug: "Erstellt URL-Slug",
      stripHtml: "Entfernt HTML",
      removeSpaces: "Entfernt Leerzeichen",
      removeDuplicateLines: "Löscht Duplikate",
      removeEmptyLines: "Entfernt Leerzeilen",
      sortLines: "Sortiert Zeilen",
      encodeBase64: "Base64 Kodieren",
      decodeBase64: "Base64 Dekodieren",
      formatJSON: "JSON Formatieren",
    },
  },
};

type Translation = (typeof translations)["bg"];

// ─── HELPER КОМПОНЕНТИ ────────────────────────────────────────────────────────

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

function TooltipButton({
  onClick,
  text,
  tip,
  isPro = false,
  isAi = false,
  isLoading = false,
  isLight,
  processingText,
}: TooltipButtonProps) {
  let btnStyle = "";
  if (isAi) {
    btnStyle = isLight
      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
      : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md";
  } else if (isPro) {
    btnStyle = isLight
      ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";
  } else {
    btnStyle = isLight
      ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm"
      : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800";
  }

  return (
    <div className="relative group inline-block w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${btnStyle}`}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {isLoading ? processingText : text}
      </button>
      <span
        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-help shadow-sm ${
          isAi
            ? "bg-blue-500 text-white"
            : isLight
            ? "bg-slate-300 text-slate-700"
            : "bg-slate-700 text-slate-300"
        }`}
        aria-hidden="true"
      >
        i
      </span>
      <div
        role="tooltip"
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal max-w-xs text-center z-50 pointer-events-none ${
          isLight
            ? "bg-slate-900 text-slate-100 border-slate-800"
            : "bg-slate-900 text-slate-200 border-slate-700"
        }`}
      >
        {tip}
      </div>
    </div>
  );
}

// ─── ГЛАВЕН КОМПОНЕНТ ────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState<Language>("bg");
  const [isLight, setIsLight] = useState(false);
  const [text, setText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedHistory, setSavedHistory] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [findVal, setFindVal] = useState("");
  const [replaceVal, setReplaceVal] = useState("");
  const [engine, setEngine] = useState("google");
  const [toastMsg, setToastMsg] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const recognitionRestartCountRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const t: Translation = translations[lang];

  // ── Инициализация от localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("textfix_history");
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) setSavedHistory(parsed);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }

    try {
      const storedTheme = localStorage.getItem("textfix_theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        setIsLight(storedTheme === "light");
      }
    } catch (e) {
      console.error("Failed to load theme:", e);
    }

    try {
      const storedLang = localStorage.getItem("textfix_lang") as Language | null;
      if (storedLang && ["bg", "en", "fr", "de"].includes(storedLang)) {
        setLang(storedLang);
      }
    } catch (e) {
      console.error("Failed to load lang:", e);
    }
  }, []);

  // ── Запазване на темата ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("textfix_theme", isLight ? "light" : "dark");
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
    // Добавя/премахва dark клас на html за CSS color-scheme
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", !isLight);
    }
  }, [isLight]);

  // ── Запазване на езика ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("textfix_lang", lang);
    } catch (e) {
      console.error("Failed to save lang:", e);
    }
  }, [lang]);

  // ── Автоматично запазване на сесия ────────────────────────────────────────
  useEffect(() => {
    if (!text.trim()) return;
    const timer = setTimeout(() => {
      setSavedHistory((prev) => {
        if (prev[0] === text) return prev;
        const filtered = prev.filter((item) => item !== text);
        const updated = [text, ...filtered].slice(0, 5);
        try {
          localStorage.setItem("textfix_history", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save history:", e);
        }
        return updated;
      });
    }, SESSION_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text]);

  // ── Cleanup при unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (historyDebounceRef.current)
        clearTimeout(historyDebounceRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(""), 3000);
  }, []);

  // ── TTS спира при промяна на текста ───────────────────────────────────────
  useEffect(() => {
    if (isSpeaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // ── История (undo/redo) с debounce за писане ──────────────────────────────
  const commitHistory = useCallback(
    (newText: string) => {
      setHistory((prevHistory) => {
        const base = prevHistory.slice(0, historyIndex + 1);
        if (base[base.length - 1] === newText) return prevHistory;
        const updated = [...base, newText];
        // Ограничаваме историята до 100 записа
        if (updated.length > 100) updated.shift();
        return updated;
      });
      setHistoryIndex((prevIdx) => {
        const base = history.slice(0, prevIdx + 1);
        return Math.min(base.length, 99);
      });
    },
    [history, historyIndex]
  );

  const updateText = useCallback(
    (newText: string, msg?: string, debounce = false) => {
      if (newText === text) return;
      setText(newText);
      if (msg) showToast(msg);

      if (debounce) {
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = setTimeout(() => {
          commitHistory(newText);
        }, HISTORY_DEBOUNCE_MS);
      } else {
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        commitHistory(newText);
      }
    },
    [text, showToast, commitHistory]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setText(prev);
      showToast(t.undo);
    }
  }, [history, historyIndex, showToast, t.undo]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setText(next);
      showToast(t.redo);
    }
  }, [history, historyIndex, showToast, t.redo]);

  // ── Статистики ────────────────────────────────────────────────────────────
  const charCount = text.length;
  const charNoSpaces = useMemo(() => text.replace(/\s/g, "").length, [text]);
  const wordCount = useMemo(
    () => (text.trim() === "" ? 0 : text.trim().split(/\s+/).length),
    [text]
  );
  const lineCount = useMemo(
    () => (text.trim() === "" ? 0 : text.split(/\r\n|\r|\n/).length),
    [text]
  );
  const paragraphCount = useMemo(
    () =>
      text.trim() === ""
        ? 0
        : text.split(/\n\s*\n/).filter((p) => p.trim() !== "").length,
    [text]
  );
  const readTime = Math.ceil(wordCount / 200);

  // ── Честотен анализ ──────────────────────────────────────────────────────
  const topWords = useMemo(() => {
    if (!text.trim()) return [];
    const stopWords = new Set([
      "и", "в", "на", "с", "за", "че", "от", "по", "да", "как", "се",
      "не", "е", "съм", "ще", "the", "and", "to", "of", "a", "in", "is",
      "it", "you", "that",
    ]);
    const wordsArr = text.toLowerCase().match(/[a-zа-я0-9]+/gi) || [];
    const freqMap: Record<string, number> = {};

    wordsArr.forEach((w) => {
      if (w.length > 2 && !stopWords.has(w)) {
        freqMap[w] = (freqMap[w] || 0) + 1;
      }
    });

    return Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [text]);

  // ── Качване на файл ──────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input, за да може да се качи същия файл отново
    e.target.value = "";

    if (file.size > MAX_FILE_SIZE) {
      showToast(t.fileTooLarge);
      return;
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (fileExt === "docx") {
      try {
        showToast(t.wordFileLoading);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const cleanText = result.value.trim();
        if (cleanText) {
          updateText(cleanText, t.wordFileLoaded);
        } else {
          updateText("", t.wordFileFallback);
        }
      } catch (err) {
        console.error("DOCX read error:", err);
        showToast(t.wordLoadError);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        updateText(content, t.fileLoaded(file.name));
      };
      reader.onerror = () => showToast(t.wordLoadError);
      reader.readAsText(file);
    }
  };

  // ── Експорт .docx ────────────────────────────────────────────────────────
  const downloadDocx = () => {
    if (!text.trim()) {
      showToast(t.noTextToDownload);
      return;
    }

    const paragraphs = text.split("\n").map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
        })
    );

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "TextFix_Document.docx");
      showToast(t.downloadedDocx);
    });
  };

  // ── Гласов вход ──────────────────────────────────────────────────────────
  const toggleVoiceInput = () => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      showToast(t.speechNotSupported);
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      showToast(t.listeningStopped);
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      recognitionRestartCountRef.current = 0;

      recognition.lang =
        lang === "bg"
          ? "bg-BG"
          : lang === "fr"
          ? "fr-FR"
          : lang === "de"
          ? "de-DE"
          : "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        showToast(t.micActive);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        if (transcript) {
          setText((prev) => {
            const newText = prev
              ? prev + " " + transcript.trim()
              : transcript.trim();
            return newText;
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech Recognition Error:", e.error);
        if (e.error === "not-allowed") {
          showToast(t.microphoneDenied);
          isListeningRef.current = false;
          setIsListening(false);
        } else if (e.error === "no-speech") {
          // Игнорираме — браузърът ще рестартира сам
        } else {
          console.warn("Speech error:", e.error);
        }
      };

      recognition.onend = () => {
        // Ограничаваме рестартите, за да не влезем в безкраен цикъл
        if (isListeningRef.current && recognitionRestartCountRef.current < 5) {
          recognitionRestartCountRef.current++;
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech start error:", err);
      showToast(t.listeningError);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // ── TTS ──────────────────────────────────────────────────────────────────
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showToast(t.ttsNotSupported);
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showToast(t.speakingStopped);
      return;
    }

    if (!text.trim()) {
      showToast(t.noTextToSpeak);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      lang === "bg"
        ? "bg-BG"
        : lang === "fr"
        ? "fr-FR"
        : lang === "de"
        ? "de-DE"
        : "en-US";

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    showToast(t.speaking);
  };

  // ── Markdown ─────────────────────────────────────────────────────────────
  const insertMarkdown = (syntax: string) => {
    if (syntax === "bold") updateText(text + " **удебелен текст**");
    else if (syntax === "italic") updateText(text + " *наклонен текст*");
    else if (syntax === "h1") updateText(text + "\n# Заглавие 1\n");
    else if (syntax === "list") updateText(text + "\n- Елемент от списък\n");
  };

  // ── Copy ─────────────────────────────────────────────────────────────────
  const copyText = async () => {
    if (!text.trim()) {
      showToast(t.noTextToCopy);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(t.copied);
    } catch {
      showToast(t.encodeError);
    }
  };

  // ── Download .txt ────────────────────────────────────────────────────────
  const downloadFile = () => {
    if (!text.trim()) {
      showToast(t.noTextToDownload);
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "TextFix_Result.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t.downloaded);
  };

  // ── AI Action ────────────────────────────────────────────────────────────
  const handleAiAction = async (
    actionType: "summary" | "fix" | "expand" | "shorten" | "simplify" | "elevate"
  ) => {
    if (!text.trim()) {
      showToast(t.noTextForAi);
      return;
    }

    setLoadingAction(actionType);
    showToast(t.processing);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action: actionType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("AI error:", response.status, errorData);
        showToast(t.aiError);
        return;
      }

      const data = await response.json();
      if (data?.result) {
        setAiResult(data.result);
        showToast(t.resultReady);
      } else {
        showToast(t.aiError);
      }
    } catch (err) {
      console.error("AI fetch error:", err);
      showToast(t.aiConnectionError);
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Search & Replace ─────────────────────────────────────────────────────
  const handleReplace = () => {
    if (!findVal) {
      showToast(t.noFindWord);
      return;
    }
    // Използваме literal replaceAll — по-сигурно от regex
    const matches = text.split(findVal).length - 1;
    if (matches === 0) {
      showToast(t.noMatches);
      return;
    }
    const newText = text.split(findVal).join(replaceVal);
    updateText(newText, t.replaced(matches));
  };

  // ── Translate ────────────────────────────────────────────────────────────
  const translateText = async (sourceLang: string, targetLang: string) => {
    if (!text.trim()) {
      showToast(t.noTextToTranslate);
      return;
    }
    showToast(t.translating);
    try {
      let translated = "";
      if (engine === "google") {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          text
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
          data[0].forEach((item: unknown) => {
            const arr = item as [string, ...unknown[]];
            if (arr[0]) translated += arr[0];
          });
        }
      } else if (engine === "mymemory") {
        const sl = sourceLang === "auto" ? "bg" : sourceLang;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${sl}|${targetLang}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.responseData?.translatedText)
          translated = data.responseData.translatedText;
      } else if (engine === "lingva") {
        const sl = sourceLang === "auto" ? "auto" : sourceLang;
        const url = `https://lingva.ml/api/v1/${sl}/${targetLang}/${encodeURIComponent(
          text
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.translation) translated = data.translation;
      }

      if (translated) {
        updateText(translated, t.translationReady);
      } else {
        showToast(t.translateNoResult);
      }
    } catch (err) {
      console.error("Translation error:", err);
      showToast(t.translateError);
    }
  };

  // ── Транслитерация ───────────────────────────────────────────────────────
  const toLatin = () => {
    const map: Record<string, string> = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
      и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
      р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
      ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
      А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ж: "Zh", З: "Z",
      И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P",
      Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch",
      Ш: "Sh", Щ: "Sht", Ъ: "A", Ь: "Y", Ю: "Yu", Я: "Ya",
    };
    let res = "";
    for (const char of text) res += map[char] ?? char;
    updateText(res, t.translitSuccess);
  };

  const toCyrillic = () => {
    let tText = text;
    if (!tText.trim()) return;
    tText = tText.replace(/\bzdrvei\b/gi, "zdravei");
    tText = tText.replace(/([aeouаеоу])i\b/gi, "$1й");
    tText = tText.replace(/([AEOUАЕОУ])I\b/g, "$1Й");

    const multiMap: Array<[string, string]> = [
      ["sht", "щ"], ["Sht", "Щ"],
      ["zh", "ж"], ["Zh", "Ж"],
      ["ch", "ч"], ["Ch", "Ч"],
      ["sh", "ш"], ["Sh", "Ш"],
      ["ts", "ц"], ["Ts", "Ц"],
      ["yu", "ю"], ["Yu", "Ю"],
      ["ya", "я"], ["Ya", "Я"],
    ];
    for (const [en, bg] of multiMap) tText = tText.split(en).join(bg);

    const singleMap: Record<string, string> = {
      a: "а", b: "б", v: "в", g: "г", d: "д", e: "е", z: "з", i: "и",
      y: "й", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р",
      s: "с", t: "т", u: "у", f: "ф", h: "х", c: "ц", w: "в",
      A: "А", B: "Б", V: "В", G: "Г", D: "Д", E: "Е", Z: "З", I: "И",
      Y: "Й", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "П", R: "Р",
      S: "С", T: "Т", U: "У", F: "Ф", H: "Х", C: "Ц", W: "В",
    };
    let res = "";
    for (const char of tText) res += singleMap[char] ?? char;
    updateText(res, t.translitSuccess);
  };

  // ── Форматиране ──────────────────────────────────────────────────────────
  const makeBIG = () => updateText(text.toUpperCase(), t.upperSuccess);
  const makeSmall = () => updateText(text.toLowerCase(), t.lowerSuccess);

  const capitalizeSentences = () => {
    // Само прави първата буква на всяко изречение главна,
    // БЕЗ да сваля останалите до малки
    const res = text.replace(
      /(^|[.!?]\s+|\n\s*)([a-zа-яё])/gi,
      (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()
    );
    updateText(res, t.sentenceSuccess);
  };

  const capitalizeTitleCase = () => {
    const res = text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
    updateText(res, t.titleSuccess);
  };

  const makeSlug = () => {
    const map: Record<string, string> = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
      и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
      р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
      ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
    };
    let slug = "";
    for (const char of text.toLowerCase()) slug += map[char] ?? char;
    slug = slug
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s]+/g, "-");
    updateText(slug, t.slugSuccess);
  };

  const stripHtmlTags = () =>
    updateText(text.replace(/<\/?[^>]+(>|$)/g, ""), t.htmlStripped);

  const removeSpaces = () =>
    updateText(text.replace(/[ \t]+/g, " ").trim(), t.spacesRemoved);

  const removeDuplicateLines = () => {
    const lines = text.split(/\r?\n/);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        unique.push(line);
      }
    }
    updateText(unique.join("\n"), t.duplicatesRemoved);
  };

  const removeEmptyLines = () => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    updateText(lines.join("\n"), t.emptyRemoved);
  };

  const sortLines = () => {
    const lines = text.split(/\r?\n/);
    lines.sort((a, b) => a.localeCompare(b, lang));
    updateText(lines.join("\n"), t.sorted);
  };

  // ── Base64 / JSON ────────────────────────────────────────────────────────
  const encodeBase64 = () => {
    try {
      const bytes = new TextEncoder().encode(text);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      updateText(btoa(binary), t.encodeSuccess);
    } catch {
      showToast(t.encodeError);
    }
  };

  const decodeBase64 = () => {
    try {
      const binary = atob(text);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const decoded = new TextDecoder().decode(bytes);
      updateText(decoded, t.decodeSuccess);
    } catch {
      showToast(t.invalidBase64);
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(text);
      updateText(JSON.stringify(parsed, null, 2), t.jsonFormatted);
    } catch {
      showToast(t.invalidJson);
    }
  };

  // ── Clear all ────────────────────────────────────────────────────────────
  const clearAll = () => updateText("", t.cleared);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main
      className={`min-h-screen transition-colors duration-300 p-4 md:p-10 font-sans flex flex-col items-center ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"
      }`}
    >
      <div className="w-full max-w-4xl space-y-6">
        {/* Хедър */}
        <header
          className={`flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div>
            <h1
              className={`text-3xl font-extrabold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {t.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex p-1 rounded-lg border gap-1 ${
                isLight
                  ? "bg-white border-slate-200"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              {(["bg", "en", "fr", "de"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-label={`Switch to ${l.toUpperCase()}`}
                  className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${
                    lang === l ? "bg-blue-600 text-white" : "text-slate-500"
                  }`}
                >
                  <span className="text-sm">
                    {l === "bg"
                      ? "🇧🇬"
                      : l === "en"
                      ? "🇬🇧"
                      : l === "fr"
                      ? "🇫🇷"
                      : "🇩🇪"}
                  </span>{" "}
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <a
              href="https://www.buymeacoffee.com"
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1 shadow-sm"
            >
              {t.buyCoffee}
            </a>

            <button
              type="button"
              onClick={() => setIsLight(!isLight)}
              className={`text-xs px-3 py-2 rounded-lg transition-all border font-medium ${
                isLight
                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {isLight ? t.darkTheme : t.lightTheme}
            </button>
          </div>
        </header>

        {/* Бутони за споделяне */}
        <ShareButtons lang={lang} />

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
          {[
            { label: t.chars, val: charCount },
            { label: t.noSpaces, val: charNoSpaces },
            { label: t.words, val: wordCount },
            { label: t.lines, val: lineCount },
            { label: t.paragraphs, val: paragraphCount },
            { label: t.readTime, val: t.readTimeValue(readTime) },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border shadow-sm ${
                isLight
                  ? "bg-white border-slate-200"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="text-lg font-bold text-blue-600">{item.val}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Качване на файл */}
        <label
          className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer block transition-all ${
            isLight
              ? "border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-slate-700"
              : "border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-slate-200"
          }`}
        >
          <div className="text-xs md:text-sm font-semibold">{t.upload}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.uploadSub}</div>
          <input
            type="file"
            accept=".txt,.csv,.md,.html,.js,.json,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Гласови инструменти и експорт */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="space-x-2 flex items-center">
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-label={t.voiceInput}
                  className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${
                    isListening
                      ? "bg-rose-600 text-white border-rose-600 shadow-md animate-pulse"
                      : isLight
                      ? "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {isListening ? t.voiceStop : t.voiceInput}
                </button>
                <div
                  role="tooltip"
                  className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal w-56 bg-slate-900 text-slate-100 z-50 pointer-events-none"
                >
                  {t.tips.voiceInput}
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-label={t.speakText}
                  className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${
                    isSpeaking
                      ? "bg-amber-600 text-white border-amber-600 shadow-md animate-pulse"
                      : isLight
                      ? "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {isSpeaking ? t.speakStop : t.speakText}
                </button>
                <div
                  role="tooltip"
                  className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal w-56 bg-slate-900 text-slate-100 z-50 pointer-events-none"
                >
                  {t.tips.speakText}
                </div>
              </div>
            </div>

            <div className="space-x-2 flex items-center">
              <button
                type="button"
                onClick={copyText}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm"
              >
                {t.copy}
              </button>
              <button
                type="button"
                onClick={downloadFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm"
              >
                {t.downloadTxt}
              </button>
              <button
                type="button"
                onClick={downloadDocx}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm"
              >
                {t.downloadDocx}
              </button>
            </div>
          </div>

          {(isListening || isSpeaking) && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col space-y-2 text-xs font-semibold shadow-inner ${
                isListening
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
                  {isListening ? t.voiceListeningMsg : t.voiceSpeakingMsg}
                </span>
                <span className="text-[10px] opacity-80">
                  {isListening ? "REC • 16kHz" : "TTS Audio"}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full animate-pulse transition-all duration-300 ${
                    isListening ? "bg-rose-500 w-full" : "bg-amber-500 w-full"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Undo/Redo + Markdown */}
        <div
          className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight
              ? "bg-white border-slate-200 shadow-sm"
              : "bg-slate-900 border-slate-800"
          }`}
        >
          <div className="flex items-center gap-1.5 border-r pr-3 border-slate-300 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
              ↕
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              {t.undo}
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              {t.redo}
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-1">
            <span className="font-semibold text-slate-500 mr-1 hidden sm:inline">
              {t.markdownTitle}
            </span>
            <button
              type="button"
              onClick={() => insertMarkdown("bold")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown("italic")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 italic rounded border border-slate-300 dark:border-slate-700"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown("h1")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown("list")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700"
            >
              • List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
          >
            {showPreview ? t.editorTitle : t.previewTitle}
          </button>
        </div>

        {/* Текстова площ */}
        {!showPreview ? (
          <textarea
            value={text}
            onChange={(e) => updateText(e.target.value, undefined, true)}
            placeholder={t.placeholder}
            className={`w-full h-48 p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm resize-y transition-all ${
              isLight
                ? "bg-white text-slate-900 border-slate-300 shadow-sm"
                : "bg-slate-900/90 text-slate-100 border-slate-800"
            }`}
          />
        ) : (
          <div
            className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm font-sans whitespace-pre-wrap ${
              isLight
                ? "bg-white text-slate-900 border-slate-300"
                : "bg-slate-900 text-slate-100 border-slate-800"
            }`}
          >
            {text || t.noTextPreview}
          </div>
        )}

        {/* Честотен анализ */}
        {topWords.length > 0 && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-slate-900 border-slate-800 text-amber-300"
            }`}
          >
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <span className="font-bold">{t.wordFreqTitle}</span>
              <span className="text-[10px] text-slate-500 italic">
                {t.wordFreqTip}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {topWords.map(([word, count], idx) => (
                <span
                  key={idx}
                  className="bg-amber-200 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-800 dark:text-slate-200"
                >
                  &quot;{word}&quot;: {count}x
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Запазена история */}
        {savedHistory.length > 0 && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              isLight
                ? "bg-white border-slate-200"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-500">
                  {t.historyTitle}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {t.historyTip}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("textfix_history");
                  } catch {
                    /* ignore */
                  }
                  setSavedHistory([]);
                }}
                className="text-rose-500 hover:underline"
              >
                {t.historyClear}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {savedHistory.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => updateText(item, t.textRestored)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded text-[11px] truncate max-w-[200px] border border-slate-200 dark:border-slate-700"
                >
                  {item.slice(0, 25)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI резултат */}
        {aiResult && (
          <div
            className={`p-4 rounded-xl space-y-3 border shadow-lg transition-all ${
              isLight
                ? "bg-blue-50/80 border-blue-200"
                : "bg-slate-900 border-slate-700"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {t.aiResultTitle}
              </span>
              <button
                type="button"
                onClick={() => setAiResult("")}
                className={`text-xs font-semibold px-2 py-1 rounded border transition-all ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {t.closeResult}
              </button>
            </div>

            <textarea
              value={aiResult}
              readOnly
              className={`w-full h-48 p-4 rounded-xl border font-sans text-sm resize-y focus:outline-none ${
                isLight
                  ? "bg-white text-slate-900 border-blue-200"
                  : "bg-slate-950 text-slate-100 border-slate-800"
              }`}
            />

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(aiResult);
                    showToast(t.copiedResult);
                  } catch {
                    showToast(t.encodeError);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                {t.copyResult}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateText(aiResult, t.mainTextReplaced)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                {t.replaceText}
              </button>
            </div>
          </div>
        )}

        {/* AI инструменти */}
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            isLight
              ? "bg-blue-50/40 border-blue-100"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {t.aiTools}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <TooltipButton
              onClick={() => handleAiAction("summary")}
              text={t.aiSummary}
              tip={t.tips.aiSummary}
              isAi
              isLoading={loadingAction === "summary"}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={() => handleAiAction("fix")}
              text={t.aiFix}
              tip={t.tips.aiFix}
              isAi
              isLoading={loadingAction === "fix"}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={() => handleAiAction("expand")}
              text={t.aiExpand}
              tip={t.tips.aiExpand}
              isAi
              isLoading={loadingAction === "expand"}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={() => handleAiAction("shorten")}
              text={t.aiShorten}
              tip={t.tips.aiShorten}
              isAi
              isLoading={loadingAction === "shorten"}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={() => handleAiAction("simplify")}
              text={t.aiSimplify}
              tip={t.tips.aiSimplify}
              isAi
              isLoading={loadingAction === "simplify"}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={() => handleAiAction("elevate")}
              text={t.aiElevate}
              tip={t.tips.aiElevate}
              isAi
              isLoading={loadingAction === "elevate"}
              isLight={isLight}
              processingText={t.processing}
            />
          </div>
        </div>

        {/* Search & Replace */}
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            isLight
              ? "bg-white border-slate-200"
              : "bg-slate-900/60 border-slate-800"
          }`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.searchReplace}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder={t.findPlaceholder}
              value={findVal}
              onChange={(e) => setFindVal(e.target.value)}
              className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-900"
                  : "bg-slate-950 border-slate-800 text-slate-100"
              }`}
            />
            <input
              type="text"
              placeholder={t.replacePlaceholder}
              value={replaceVal}
              onChange={(e) => setReplaceVal(e.target.value)}
              className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${
                isLight
                  ? "bg-slate-50 border-slate-300 text-slate-900"
                  : "bg-slate-950 border-slate-800 text-slate-100"
              }`}
            />
            <button
              type="button"
              onClick={handleReplace}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              {t.replaceBtn}
            </button>
          </div>
        </div>

        {/* Превод */}
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            isLight
              ? "bg-white border-slate-200"
              : "bg-slate-900/60 border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.transEngine}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <label htmlFor="trans-engine">{t.engineLabel}</label>
              <select
                id="trans-engine"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className={`border text-xs px-2 py-1 rounded-md outline-none ${
                  isLight
                    ? "bg-slate-50 border-slate-300 text-slate-800"
                    : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              >
                <option value="google">Google Translate</option>
                <option value="mymemory">MyMemory Engine</option>
                <option value="lingva">Lingva Open Engine</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { src: "bg", tgt: "en", label: t.transEn },
              { src: "en", tgt: "bg", label: t.transBg },
              { src: "auto", tgt: "de", label: t.transDe },
              { src: "auto", tgt: "fr", label: t.transFr },
            ].map((btn, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => translateText(btn.src, btn.tgt)}
                className={`border py-2 rounded-lg text-xs font-semibold transition-all ${
                  isLight
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Транслитерация */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.translit}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TooltipButton
              onClick={toLatin}
              text={t.cyrToLat}
              tip={t.tips.toLatin}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={toCyrillic}
              text={t.latToCyr}
              tip={t.tips.toCyrillic}
              isLight={isLight}
              processingText={t.processing}
            />
          </div>
        </div>

        {/* Почистване и форматиране */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.tools}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <TooltipButton
              onClick={makeBIG}
              text={t.uppercase}
              tip={t.tips.uppercase}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={makeSmall}
              text={t.lowercase}
              tip={t.tips.lowercase}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={capitalizeSentences}
              text={t.sentenceCase}
              tip={t.tips.sentenceCase}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={capitalizeTitleCase}
              text={t.titleCase}
              tip={t.tips.titleCase}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={makeSlug}
              text={t.slug}
              tip={t.tips.slug}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={stripHtmlTags}
              text={t.stripHtml}
              tip={t.tips.stripHtml}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={removeSpaces}
              text={t.removeSpaces}
              tip={t.tips.removeSpaces}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={removeDuplicateLines}
              text={t.removeDuplicates}
              tip={t.tips.removeDuplicateLines}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={removeEmptyLines}
              text={t.removeEmpty}
              tip={t.tips.removeEmptyLines}
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={sortLines}
              text={t.sortLines}
              tip={t.tips.sortLines}
              isLight={isLight}
              processingText={t.processing}
            />
            <button
              type="button"
              onClick={clearAll}
              className={`border text-xs py-2 rounded-lg transition-all col-span-2 sm:col-span-1 font-semibold ${
                isLight
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                  : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60"
              }`}
            >
              {t.clearAll}
            </button>
          </div>
        </div>

        {/* PRO инструменти */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.proTools}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TooltipButton
              onClick={encodeBase64}
              text={t.encodeBase64}
              tip={t.tips.encodeBase64}
              isPro
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={decodeBase64}
              text={t.decodeBase64}
              tip={t.tips.decodeBase64}
              isPro
              isLight={isLight}
              processingText={t.processing}
            />
            <TooltipButton
              onClick={formatJSON}
              text={t.formatJSON}
              tip={t.tips.formatJSON}
              isPro
              isLight={isLight}
              processingText={t.processing}
            />
          </div>
        </div>

        {/* Футър */}
        <footer
          className={`pt-8 border-t text-center text-xs text-slate-500 space-y-3 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div>
            TextFix Pro &copy; 2026 —{" "}
            {lang === "bg"
              ? "Интелигентен текстов помощник & Редактор"
              : lang === "en"
              ? "Intelligent Text Assistant & Editor"
              : lang === "fr"
              ? "Assistant textuel intelligent & Éditeur"
              : "Intelligenter Textassistent & Editor"}
          </div>
          <div>
            <a
              href="https://www.buymeacoffee.com"
              target="_blank"
              rel="noreferrer"
              className={`inline-block border px-4 py-2 rounded-full font-medium transition-all ${
                isLight
                  ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              {t.buyCoffee} ☕
            </a>
          </div>
        </footer>
      </div>

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl transition-all animate-bounce z-50"
        >
          {toastMsg}
        </div>
      )}
    </main>
  );
}