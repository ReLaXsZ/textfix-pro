'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

type Language = 'bg' | 'en' | 'fr' | 'de';

const translations = {
  bg: {
    title: 'TextFix Pro',
    subtitle: 'Интелигентен текстов помощник & Редактор v2.0',
    chars: 'Символа',
    noSpaces: 'Без интервали',
    words: 'Думи',
    lines: 'Редове',
    paragraphs: 'Абзаци',
    readTime: 'Време за четене',
    upload: '📁 Качете файл (.txt, .md, .json, .docx)',
    uploadSub: 'Поддържа автоматично извличане на текст от Word, Markdown и текстов формат',
    undo: '↩️ Назад',
    redo: '↪️ Напред',
    copy: '📋 Копирай',
    downloadTxt: '💾 Изтегли .txt',
    downloadDocx: '📄 Изтегли .docx (Word)',
    placeholder: 'Въведете или поставете вашия текст тук...',
    aiTools: '🤖 Интелигентни AI инструменти',
    aiSummary: '✨ AI Резюме',
    aiFix: '📝 AI Поправи граматиката',
    aiExpand: '🚀 AI Разшири текста',
    aiShorten: '📉 AI Скъси текста',
    aiSimplify: '🧸 AI Опрости нивото',
    aiElevate: '🎓 AI Повиши нивото',
    aiResultTitle: '🤖 Интелигентен резултат:',
    copyResult: '📋 Копирай резултата',
    replaceText: '🔄 Замени главния текст',
    closeResult: '❌ Затвори',
    processing: 'Обработва се...',
    voiceInput: '🎤 Гласов вход (Диктуване)',
    voiceStop: '⏹️ Спри диктуването',
    speakText: '🔊 Прочети на глас',
    speakStop: '🔇 Спри четенето',
    voiceListeningMsg: '🎙️ Записването е активно... Говорете на микрофона',
    voiceSpeakingMsg: '🔊 Прочитане на съдържанието на глас...',
    wordFreqTitle: '📊 Анализ на повторенията (Честота на думите):',
    wordFreqTip: 'Показва най-често използваните значими думи. Използвайте го, за да избегнете тавтология.',
    historyTitle: '💾 Запазени сесии (Локална памет):',
    historyTip: 'Текстът се запазва автоматично в браузъра ви. Данните не се изпращат на външни сървъри.',
    historyRestore: 'Възстанови',
    historyClear: 'Изчисти историята',
    markdownTitle: '✍️ Бързо форматиране (Markdown):',
    previewTitle: '👁️ Преглед',
    searchReplace: '🔍 Търсене & Замяна',
    findPlaceholder: 'Търси дума...',
    replacePlaceholder: 'Замени с...',
    replaceBtn: 'Замени всички',
    transEngine: '🌐 Превод на езици',
    engineLabel: 'Изберете услуга:',
    transEn: 'Преведи на Английски 🇬🇧',
    transBg: 'Преведи на Български 🇧🇬',
    transDe: 'Преведи на Немски 🇩🇪',
    transFr: 'Преведи на Френски 🇫🇷',
    translit: '🔠 Смяна на азбуката (Транслитерация)',
    cyrToLat: 'Кирилица ➔ Латиница',
    latToCyr: 'Латиница ➔ Кирилица',
    tools: '🛠️ Почистване и Форматиране',
    uppercase: 'ГОЛЕМИ БУКВИ',
    lowercase: 'малки букви',
    sentenceCase: '✏️ Главна буква на изречение',
    titleCase: '🔠 Заглавни букви',
    slug: '🔗 Уеб линк (Slug)',
    stripHtml: '🧹 Изчисти HTML кодове',
    removeSpaces: 'Премахни излишни интервали',
    removeDuplicates: 'Премахни повтарящи се редове',
    removeEmpty: 'Премахни празни редове',
    sortLines: 'Сортирай редовете (А-Я)',
    clearAll: 'Изчисти всичко',
    proTools: '⚡ PRO Инструменти за напреднали',
    encodeBase64: '🔐 Base64 Кодиране',
    decodeBase64: '🔓 Base64 Декодиране',
    formatJSON: '📦 Форматирай JSON',
    buyCoffee: '☕ Купи ми кафе',
    lightTheme: '☀️ Светъл режим',
    darkTheme: '🌙 Тъмен режим',
    tips: {
      aiSummary: 'Използва изкуствен интелект за съставяне на кратко резюме',
      aiFix: 'Автоматично коригира правописни, граматични и пунктуационни грешки',
      aiExpand: 'Развива идеите ви в по-подробен и структуриран текст',
      aiShorten: 'Съкращава съдържанието, запазвайки основните акценти',
      aiSimplify: 'Пренаписва текста на достъпен и елементарен език',
      aiElevate: 'Пренаписва текста в по-професионален и официален стил',
      voiceInput: 'Кликнете за стартиране на гласовия вход. Уверете се, че микрофонът е разрешен в браузъра.',
      speakText: 'Прочита целия текст с синтезиран глас на избрания език.',
      toLatin: 'Преобразува български букви в латински съответствия',
      toCyrillic: 'Преобразува латински текст в кирилица по умни правила',
      uppercase: 'Преобразува всички букви в главни',
      lowercase: 'Преобразува всички букви в малки',
      sentenceCase: 'Прави първата буква на всяко изречение главна',
      titleCase: 'Прави първата буква на всяка дума главна',
      slug: 'Превръща текст в чист URL адрес на латиница',
      stripHtml: 'Премахва скрити HTML тагове и форматиране',
      removeSpaces: 'Премахва излишните празни места и табулации',
      removeDuplicates: 'Изтрива напълно дублиращите се редове',
      removeEmpty: 'Премахва празните редове в текста',
      sortLines: 'Сортира всички редове по азбучен ред',
      encodeBase64: 'Кодира текста в зашифрован Base64 формат',
      decodeBase64: 'Декодира Base64 обратно в нормален текст',
      formatJSON: 'Форматира и подрежда JSON структури с отстъпи',
    },
  },
  en: {
    title: 'TextFix Pro',
    subtitle: 'Intelligent Text Assistant & Editor v2.0',
    chars: 'Characters',
    noSpaces: 'No spaces',
    words: 'Words',
    lines: 'Lines',
    paragraphs: 'Paragraphs',
    readTime: 'Reading time',
    upload: '📁 Upload file (.txt, .md, .json, .docx)',
    uploadSub: 'Supports text extraction from Word, Markdown, and plain text files',
    undo: '↩️ Undo',
    redo: '↪️ Redo',
    copy: '📋 Copy',
    downloadTxt: '💾 Download .txt',
    downloadDocx: '📄 Download .docx (Word)',
    placeholder: 'Type or paste your text here...',
    aiTools: '🤖 Intelligent AI Tools',
    aiSummary: '✨ AI Summary',
    aiFix: '📝 AI Fix Grammar',
    aiExpand: '🚀 AI Expand Text',
    aiShorten: '📉 AI Shorten',
    aiSimplify: '🧸 AI Simplify',
    aiElevate: '🎓 AI Elevate Style',
    aiResultTitle: '🤖 Intelligent Result:',
    copyResult: '📋 Copy Result',
    replaceText: '🔄 Replace Main Text',
    closeResult: '❌ Close',
    processing: 'Processing...',
    voiceInput: '🎤 Voice Input (Dictate)',
    voiceStop: '⏹️ Stop Dictation',
    speakText: '🔊 Read Aloud',
    speakStop: '🔇 Stop Reading',
    voiceListeningMsg: '🎙️ Recording active... Speak into the microphone',
    voiceSpeakingMsg: '🔊 Reading content aloud...',
    wordFreqTitle: '📊 Word Frequency Analysis:',
    wordFreqTip: 'Shows top used significant words to help avoid repetition.',
    historyTitle: '💾 Saved Sessions (Local Storage):',
    historyTip: 'Text is saved automatically in your browser. No data is sent to external servers.',
    historyRestore: 'Restore',
    historyClear: 'Clear History',
    markdownTitle: '✍️ Quick Formatting (Markdown):',
    previewTitle: '👁️ Preview',
    searchReplace: '🔍 Search & Replace',
    findPlaceholder: 'Find word...',
    replacePlaceholder: 'Replace with...',
    replaceBtn: 'Replace All',
    transEngine: '🌐 Translation Engines',
    engineLabel: 'Select service:',
    transEn: 'Translate to English 🇬🇧',
    transBg: 'Translate to Bulgarian 🇬🇧',
    transDe: 'Translate to German 🇩🇪',
    transFr: 'Translate to French 🇫🇷',
    translit: '🔠 Transliteration',
    cyrToLat: 'Cyrillic ➔ Latin',
    latToCyr: 'Latin ➔ Cyrillic',
    tools: '🛠️ Cleaning & Formatting',
    uppercase: 'UPPERCASE',
    lowercase: 'lowercase',
    sentenceCase: '✏️ Sentence case',
    titleCase: '🔠 Title Case',
    slug: '🔗 Web Slug',
    stripHtml: '🧹 Strip HTML tags',
    removeSpaces: 'Remove extra spaces',
    removeDuplicates: 'Remove duplicate lines',
    removeEmpty: 'Remove empty lines',
    sortLines: 'Sort lines (A-Z)',
    clearAll: 'Clear All',
    proTools: '⚡ PRO Advanced Tools',
    encodeBase64: '🔐 Base64 Encode',
    decodeBase64: '🔓 Base64 Decode',
    formatJSON: '📦 Format JSON',
    buyCoffee: '☕ Buy me a coffee',
    lightTheme: '☀️ Light Theme',
    darkTheme: '🌙 Dark Theme',
    tips: {
      aiSummary: 'Uses AI to create a concise summary',
      aiFix: 'Fixes grammar, spelling, and style errors automatically',
      aiExpand: 'Expands your points into detailed text',
      aiShorten: 'Shortens content while keeping key ideas',
      aiSimplify: 'Rewrites text in simple and clear words',
      aiElevate: 'Rewrites text in a refined, professional tone',
      voiceInput: 'Click to dictate via microphone. Make sure microphone access is allowed.',
      speakText: 'Reads the entire text aloud using Speech Synthesis.',
      toLatin: 'Converts Cyrillic characters to Latin letters',
      toCyrillic: 'Converts Latin letters to Cyrillic',
      uppercase: 'Converts all letters to uppercase',
      lowercase: 'Converts all letters to lowercase',
      sentenceCase: 'Capitalizes the first letter of each sentence',
      titleCase: 'Capitalizes the first letter of every word',
      slug: 'Transforms text into a clean URL slug',
      stripHtml: 'Removes hidden HTML tags',
      removeSpaces: 'Cleans up extra empty spaces',
      removeDuplicateLines: 'Deletes duplicate lines completely',
      removeEmptyLines: 'Removes blank lines',
      sortLines: 'Sorts text lines alphabetically',
      encodeBase64: 'Encodes text into Base64 format',
      decodeBase64: 'Decodes Base64 text back',
      formatJSON: 'Formats JSON code with proper spacing',
    },
  },
  fr: {
    title: 'TextFix Pro',
    subtitle: 'Assistant textuel intelligent v2.0',
    chars: 'Caractères',
    noSpaces: 'Sans espaces',
    words: 'Mots',
    lines: 'Lignes',
    paragraphs: 'Paragraphes',
    readTime: 'Temps de lecture',
    upload: '📁 Charger un fichier (.txt, .md, .json, .docx)',
    uploadSub: 'Extraction automatique de texte Word, Markdown et fichier texte',
    undo: '↩️ Annuler',
    redo: '↪️ Rétablir',
    copy: '📋 Copier',
    downloadTxt: '💾 Télécharger .txt',
    downloadDocx: '📄 Télécharger .docx (Word)',
    placeholder: 'Saisissez ou collez votre texte ici...',
    aiTools: '🤖 Outils IA Intelligents',
    aiSummary: '✨ Résumé IA',
    aiFix: '📝 Corriger la grammaire',
    aiExpand: '🚀 Développer le texte',
    aiShorten: '📉 Raccourcir',
    aiSimplify: '🧸 Simplifier',
    aiElevate: '🎓 Élever le style',
    aiResultTitle: '🤖 Résultat Intelligent :',
    copyResult: '📋 Copier le résultat',
    replaceText: '🔄 Remplacer le texte',
    closeResult: '❌ Fermer',
    processing: 'Traitement en cours...',
    voiceInput: '🎤 Saisie vocale',
    voiceStop: '⏹️ Arrêter la dictée',
    speakText: '🔊 Lire à haute voix',
    speakStop: '🔇 Arrêter la lecture',
    voiceListeningMsg: '🎙️ Enregistrement actif... Parlez clairement',
    voiceSpeakingMsg: '🔊 Lecture du contenu...',
    wordFreqTitle: '📊 Analyse de fréquence des mots :',
    wordFreqTip: 'Affiche les mots les plus utilisés pour éviter les répétitions.',
    historyTitle: '💾 Historique enregistré :',
    historyTip: 'Sauvegarde automatique dans le navigateur. Aucune donnée envoyée au serveur.',
    historyRestore: 'Raurer',
    historyClear: 'Effacer l’historique',
    markdownTitle: '✍️ Formatage rapide (Markdown) :',
    previewTitle: '👁️ Aperçu',
    searchReplace: '🔍 Rechercher et Remplacer',
    findPlaceholder: 'Rechercher...',
    replacePlaceholder: 'Remplacer par...',
    replaceBtn: 'Tout remplacer',
    transEngine: '🌐 Moteur de Traduction',
    engineLabel: 'Sélectionnez un service:',
    transEn: 'Traduire en Anglais 🇬🇧',
    transBg: 'Traduire en Bulgare 🇬🇧',
    transDe: 'Traduire en Allemand 🇩🇪',
    transFr: 'Traduire en Français 🇫🇷',
    translit: '🔠 Translittération',
    cyrToLat: 'Cyrillique ➔ Latin',
    latToCyr: 'Latin ➔ Cyrillique',
    tools: '🛠️ Nettoyage & Formatage',
    uppercase: 'MAJUSCULES',
    lowercase: 'minuscules',
    sentenceCase: '✏️ Majuscule en début de phrase',
    titleCase: '🔠 Cas de Titre',
    slug: '🔗 Slug Web',
    stripHtml: '🧹 Supprimer balises HTML',
    removeSpaces: 'Supprimer espaces superflus',
    removeDuplicates: 'Supprimer lignes en double',
    removeEmpty: 'Supprimer lignes vides',
    sortLines: 'Trier lignes (A-Z)',
    clearAll: 'Tout effacer',
    proTools: '⚡ Outils Avancés PRO',
    encodeBase64: '🔐 Encodage Base64',
    decodeBase64: '🔓 Décodage Base64',
    formatJSON: '📦 Formater JSON',
    buyCoffee: '☕ Offrez-moi un café',
    lightTheme: '☀️ Mode Clair',
    darkTheme: '🌙 Mode Sombre',
    tips: {
      aiSummary: 'Utilise l’IA pour créer un résumé concis',
      aiFix: 'Corrige la grammaire et le style automatiquement',
      aiExpand: 'Développe vos idées',
      aiShorten: 'Raccourcit le texte',
      aiSimplify: 'Rend le texte plus simple',
      aiElevate: 'Améliore le niveau de langue',
      voiceInput: 'Dictez via le micro. Autorisez l’accès au micro.',
      speakText: 'Lit le texte à haute voix.',
      toLatin: 'Convertit le cyrillique en latin',
      toCyrillic: 'Convertit le latin en cyrillique',
      uppercase: 'Met en majuscules',
      lowercase: 'Met en minuscules',
      sentenceCase: 'Majuscule au début des phrases',
      titleCase: 'Majuscule à chaque mot',
      slug: 'Crée un slug URL propre',
      stripHtml: 'Supprime le HTML',
      removeSpaces: 'Nettoie les espaces',
      removeDuplicateLines: 'Supprime les doublons',
      removeEmptyLines: 'Supprime les lignes vides',
      sortLines: 'Trie les lignes',
      encodeBase64: 'Encode en Base64',
      decodeBase64: 'Décode le Base64',
      formatJSON: 'Formate le JSON',
    },
  },
  de: {
    title: 'TextFix Pro',
    subtitle: 'Intelligenter Textassistent v2.0',
    chars: 'Zeichen',
    noSpaces: 'Ohne Leerzeichen',
    words: 'Wörter',
    lines: 'Zeilen',
    paragraphs: 'Absätze',
    readTime: 'Lesezeit',
    upload: '📁 Datei hochladen (.txt, .md, .json, .docx)',
    uploadSub: 'Automatische Textextraktion aus Word und Textdateien',
    undo: '↩️ Rückgängig',
    redo: '↪️ Wiederholen',
    copy: '📋 Kopieren',
    downloadTxt: '💾 .txt herunterladen',
    downloadDocx: '📄 .docx (Word) herunterladen',
    placeholder: 'Geben Sie Ihren Text hier ein oder fügen Sie ihn ein...',
    aiTools: '🤖 Intelligente KI-Werkzeuge',
    aiSummary: '✨ KI Zusammenfassung',
    aiFix: '📝 KI Grammatik korrigieren',
    aiExpand: '🚀 KI Text erweitern',
    aiShorten: '📉 KI Text kürzen',
    aiSimplify: '🧸 KI Vereinfachen',
    aiElevate: '🎓 KI Niveau erhöhen',
    aiResultTitle: '🤖 Intelligentes Ergebnis:',
    copyResult: '📋 Ergebnis kopieren',
    replaceText: '🔄 Text ersetzen',
    closeResult: '❌ Schließen',
    processing: 'Wird verarbeitet...',
    voiceInput: '🎤 Spracheingabe',
    voiceStop: '⏹️ Diktieren beenden',
    speakText: '🔊 Vorlesen',
    speakStop: '🔇 Vorlesen beenden',
    voiceListeningMsg: '🎙️ Aufnahme aktiv... Bitte deutlich sprechen',
    voiceSpeakingMsg: '🔊 Inhalt wird vorgelesen...',
    wordFreqTitle: '📊 Worthäufigkeitsanalyse:',
    wordFreqTip: 'Zeigt oft genutzte Wörter zur Vermeidung von Wiederholungen.',
    historyTitle: '💾 Gespeicherter Verlauf:',
    historyTip: 'Automatische Speicherung im Browser. Keine Serverübertragung.',
    historyRestore: 'Wiederherstellen',
    historyClear: 'Verlauf löschen',
    markdownTitle: '✍️ Schnelle Formatierung (Markdown):',
    previewTitle: '👁️ Vorschau',
    searchReplace: '🔍 Suchen & Ersetzen',
    findPlaceholder: 'Wort suchen...',
    replacePlaceholder: 'Ersetzen durch...',
    replaceBtn: 'Alle ersetzen',
    transEngine: '🌐 Übersetzungsdienst',
    engineLabel: 'Dienst auswählen:',
    transEn: 'Ins Englische übersetzen 🇬🇧',
    transBg: 'Ins Bulgarische übersetzen 🇬🇧',
    transDe: 'Ins Deutsche übersetzen 🇩🇪',
    transFr: 'Ins Französische übersetzen 🇫🇷',
    translit: '🔠 Transliteration',
    cyrToLat: 'Kyrillisch ➔ Lateinisch',
    latToCyr: 'Lateinisch ➔ Kyrillisch',
    tools: '🛠️ Bereinigung & Formatierung',
    uppercase: 'GROSSBUCHSTABEN',
    lowercase: 'kleinbuchstaben',
    sentenceCase: '✏️ Satzanfang groß',
    titleCase: '🔠 Wortanfänge Groß',
    slug: '🔗 Web-Slug',
    stripHtml: '🧹 HTML-Tags entfernen',
    removeSpaces: 'Extra Leerzeichen entfernen',
    removeDuplicates: 'Doppelte Zeilen entfernen',
    removeEmpty: 'Leere Zeilen entfernen',
    sortLines: 'Zeilen sortieren (A-Z)',
    clearAll: 'Alles löschen',
    proTools: '⚡ PRO Erweiterte Werkzeuge',
    encodeBase64: '🔐 Base64 Kodieren',
    decodeBase64: '🔓 Base64 Dekodieren',
    formatJSON: '📦 JSON Formatieren',
    buyCoffee: '☕ Spendier mir einen Kaffee',
    lightTheme: '☀️ Helles Design',
    darkTheme: '🌙 Dunkles Design',
    tips: {
      aiSummary: 'Verwendet KI zur Zusammenfassung',
      aiFix: 'Korrigiert Grammatik automatisch',
      aiExpand: 'Erweitert Ideen',
      aiShorten: 'Kürzt den Text',
      aiSimplify: 'Vereinfacht die Sprache',
      aiElevate: 'Hebt das Niveau',
      voiceInput: 'Über Mikrofon diktieren.',
      speakText: 'Liest den Text laut vor.',
      toLatin: 'Kyrillisch zu Latein',
      toCyrillic: 'Latein zu Kyrillisch',
      uppercase: 'In Großbuchstaben',
      lowercase: 'In Kleinbuchstaben',
      sentenceCase: 'Satzanfang groß',
      titleCase: 'Wortanfänge groß',
      slug: 'Erstellt URL-Slug',
      stripHtml: 'Entfernt HTML',
      removeSpaces: 'Entfernt Leerzeichen',
      removeDuplicateLines: 'Löscht Duplikate',
      removeEmptyLines: 'Entfernt Leerzeilen',
      sortLines: 'Sortiert Zeilen',
      encodeBase64: 'Base64 Kodieren',
      decodeBase64: 'Base64 Dekodieren',
      formatJSON: 'JSON Formatieren',
    },
  },
};

export default function Home() {
  const [lang, setLang] = useState<Language>('bg');
  const [isLight, setIsLight] = useState(false);
  const [text, setText] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedHistory, setSavedHistory] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [findVal, setFindVal] = useState('');
  const [replaceVal, setReplaceVal] = useState('');
  const [engine, setEngine] = useState('google');
  const [toastMsg, setToastMsg] = useState('');

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const t = translations[lang];

  useEffect(() => {
    const stored = localStorage.getItem('textfix_history');
    if (stored) {
      try {
        setSavedHistory(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (!text.trim()) return;
    const timer = setTimeout(() => {
      setSavedHistory((prev) => {
        const filtered = prev.filter((item) => item !== text);
        const updated = [text, ...filtered].slice(0, 5);
        localStorage.setItem('textfix_history', JSON.stringify(updated));
        return updated;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [text]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const updateText = (newText: string, msg?: string) => {
    if (newText === text) return;
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newText);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setText(newText);
    if (msg) showToast(msg);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setText(prev);
      showToast(t.undo);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setText(next);
      showToast(t.redo);
    }
  };

  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text.trim() === '' ? 0 : text.split(/\r\n|\r|\n/).length;
  const paramCount = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== '').length;
  const readTime = Math.ceil(wordCount / 200);

  const getTopWords = () => {
    if (!text.trim()) return [];
    const stopWords = new Set(['и', 'в', 'на', 'с', 'за', 'че', 'от', 'по', 'да', 'как', 'се', 'не', 'е', 'съм', 'ще', 'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that']);
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'docx') {
      try {
        showToast('Зареждане на Word файл...');
        const arrayBuffer = await file.arrayBuffer();
        const textContent = new TextDecoder().decode(arrayBuffer);
        const cleanText = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        updateText(cleanText || 'Зареден е Word документ.', `Файлът "${file.name}" е зареден!`);
      } catch {
        alert('Грешка при четене на .docx файла.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        updateText(content, `Файлът "${file.name}" е зареден!`);
      };
      reader.readAsText(file);
    }
  };

  const downloadDocx = () => {
    if (!text.trim()) return alert('Няма текст за изтегляне!');
    
    const paragraphs = text.split('\n').map((line) => new Paragraph({
      children: [new TextRun({ text: line, size: 24 })],
    }));

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'TextFix_Document.docx');
      showToast('Word файлът е изтеглен успешно!');
    });
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Вашият браузър не поддържа SpeechRecognition API за гласов вход.');
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      showToast('Гласовият вход е спрян.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      isListeningRef.current = true;

      recognition.lang = lang === 'bg' ? 'bg-BG' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Микрофонът е активен! Започнете да говорите...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setText((prev) => (prev ? prev + ' ' + transcript.trim() : transcript.trim()));
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech Recognition Event Error:', e.error);
        if (e.error === 'not-allowed') {
          alert('Моля, разрешете достъпа до микрофона в настройките на браузъра за този сайт.');
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // Игнорира ако вече е стартирано
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      alert('Грешка при стартиране на гласовия вход.');
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Вашият браузър не поддържа прочитане на глас.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showToast('Четенето е спряно.');
      return;
    }

    if (!text.trim()) return alert('Въведете текст за прочитане!');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'bg' ? 'bg-BG' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    showToast('Прочитане на текста...');
  };

  const insertMarkdown = (syntax: string) => {
    if (syntax === 'bold') updateText(text + ' **удебелен текст**');
    else if (syntax === 'italic') updateText(text + ' *наклонен текст*');
    else if (syntax === 'h1') updateText(text + '\n# Заглавие 1\n');
    else if (syntax === 'list') updateText(text + '\n- Елемент от списък\n');
  };

  const copyText = () => {
    if (!text.trim()) return alert('Няма текст за копиране!');
    navigator.clipboard.writeText(text);
    showToast('Текстът е копиран успешно!');
  };

  const downloadFile = () => {
    if (!text.trim()) return alert('Няма текст за изтегляне!');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'TextFix_Result.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Файлът е изтеглен!');
  };

  const handleAiAction = async (actionType: 'summary' | 'fix' | 'expand' | 'shorten' | 'simplify' | 'elevate') => {
    if (!text.trim()) {
      alert('Моля, въведете текст за анализ!');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      alert('Грешка: Липсва конфигурационен ключ във файла .env.local!');
      return;
    }

    setLoadingAction(actionType);
    showToast(t.processing);

    let prompt = '';
    if (actionType === 'summary') {
      prompt = `Summarize the following text concisely in the same language:\n\n${text}`;
    } else if (actionType === 'fix') {
      prompt = `Fix any grammar, spelling, and styling errors in the following text, keeping the same language:\n\n${text}`;
    } else if (actionType === 'expand') {
      prompt = `Expand, enrich, and improve the following text professionally with detailed options or expanded content in the same language:\n\n${text}`;
    } else if (actionType === 'shorten') {
      prompt = `Shorten and condense the following text while keeping the core meaning, in the same language:\n\n${text}`;
    } else if (actionType === 'simplify') {
      prompt = `Rewrite the following text to make it extremely simple, clear, and easy to understand for everyone, in the same language:\n\n${text}`;
    } else if (actionType === 'elevate') {
      prompt = `Elevate and rewrite the following text into an exquisite, highly professional, and sophisticated style, keeping the same language:\n\n${text}`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        setAiResult(aiResponse.trim());
        showToast('Резултатът е готов!');
      } else {
        alert('Грешка при обработката от асистента.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Грешка при връзката със сървъра.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReplace = () => {
    if (!findVal) return alert('Моля, въведете дума за търсене!');
    const regex = new RegExp(findVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (text.match(regex) || []).length;
    if (matches === 0) return alert('Не бяха намерени съвпадения.');
    const newText = text.replace(regex, replaceVal);
    updateText(newText, `Заменени ${matches} места!`);
  };

  const translateText = async (sourceLang: string, targetLang: string) => {
    if (!text.trim()) return alert('Моля, въведете текст за превод!');
    showToast('Превежда се... моля изчакайте');
    try {
      let translated = '';
      if (engine === 'google') {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
          data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
        }
      } else if (engine === 'mymemory') {
        const sl = sourceLang === 'auto' ? 'bg' : sourceLang;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${targetLang}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.responseData) translated = data.responseData.translatedText;
      } else if (engine === 'lingva') {
        const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
        const url = `https://lingva.ml/api/v1/${sl}/${targetLang}/${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.translation) translated = data.translation;
      }

      if (translated) {
        updateText(translated, 'Преводът е готов!');
      } else {
        alert('Опитайте с друг преводач от менюто.');
      }
    } catch {
      alert('Грешка при връзката с преводача.');
    }
  };

  const toLatin = () => {
    const map: Record<string, string> = {
      а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ж:'zh', з:'z', и:'i', й:'y',
      к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u',
      ф:'f', х:'h', ц:'ts', ч:'ch', ш:'sh', щ:'sht', ъ:'a', ь:'y', ю:'yu', я:'ya',
      А:'A', Б:'B', В:'V', Г:'G', Д:'D', Е:'E', Ж:'Zh', З:'Z', И:'I', Й:'Y',
      К:'K', Л:'L', М:'M', Н:'N', О:'O', П:'P', Р:'R', С:'S', Т:'T', У:'U',
      Ф:'F', Х:'H', Ц:'Ts', Ч:'Ch', Ш:'Sh', Щ:'Sht', Ъ:'A', Ь:'Y', Ю:'Yu', Я:'Ya'
    };
    let res = '';
    for (let char of text) res += map[char] !== undefined ? map[char] : char;
    updateText(res, 'Транслитерацията към латиница е успешна!');
  };

  const toCyrillic = () => {
    let tText = text;
    if (!tText.trim()) return;
    tText = tText.replace(/\bzdrvei\b/gi, 'zdravei');
    tText = tText.replace(/([aeouаеоу])i\b/gi, '$1й');
    tText = tText.replace(/([AEOUАЕОУ])I\b/g, '$1Й');

    const multiMap = [
      { en: 'sht', bg: 'щ' }, { en: 'Sht', bg: 'Щ' },
      { en: 'zh', bg: 'ж' },  { en: 'Zh', bg: 'Ж' },
      { en: 'ch', bg: 'ч' },  { en: 'Ch', bg: 'Ч' },
      { en: 'sh', bg: 'ш' },  { en: 'Sh', bg: 'Ш' },
      { en: 'ts', bg: 'ц' },  { en: 'Ts', bg: 'Ц' },
      { en: 'yu', bg: 'ю' },  { en: 'Yu', bg: 'Ю' },
      { en: 'ya', bg: 'я' },  { en: 'Ya', bg: 'Я' }
    ];
    for (let pair of multiMap) tText = tText.replaceAll(pair.en, pair.bg);

    const singleMap: Record<string, string> = {
      a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и',
      y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
      s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', c: 'ц', w: 'в',
      A: 'А', B: 'Б', V: 'В', G: 'Г', D: 'Д', E: 'Е', Z: 'З', I: 'И',
      Y: 'Й', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', R: 'Р',
      S: 'С', T: 'Т', U: 'У', F: 'Ф', H: 'Х', C: 'Ц', W: 'В'
    };
    let res = '';
    for (let char of tText) res += singleMap[char] !== undefined ? singleMap[char] : char;
    updateText(res, 'Транслитерацията към кирилица е успешна!');
  };

  const makeBIG = () => updateText(text.toUpperCase(), 'ГОЛЕМИ БУКВИ!');
  const makeSmall = () => updateText(text.toLowerCase(), 'малки букви!');
  const capitalizeSentences = () => {
    let res = text.toLowerCase().replace(/(^\s*|[.!?\n]\s+)([a-zа-я])/gi, (m) => m.toUpperCase());
    updateText(res, 'Главни букви на изреченията!');
  };
  const capitalizeTitleCase = () => {
    let res = text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
    updateText(res, 'Заглавни букви!');
  };
  const makeSlug = () => {
    const map: Record<string, string> = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya'};
    let slug = '';
    for (let char of text.toLowerCase()) slug += map[char] !== undefined ? map[char] : char;
    slug = slug.replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s]+/g, '-');
    updateText(slug, 'Генериран уеб линк!');
  };
  const stripHtmlTags = () => updateText(text.replace(/<\/?[^>]+(>|$)/g, ''), 'HTML таговете са премахнати!');
  const removeSpaces = () => updateText(text.replace(/[ \t]+/g, ' ').trim(), 'Излишните интервали са премахнати!');
  const removeDuplicateLines = () => {
    const lines = text.split(/\r?\n/);
    updateText([...new Set(lines)].join('\n'), 'Дублиращите се редове са премахнати!');
  };
  const removeEmptyLines = () => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    updateText(lines.join('\n'), 'Празните редове са премахнати!');
  };
  const sortLines = () => {
    const lines = text.split(/\r?\n/);
    lines.sort((a, b) => a.localeCompare(b, 'bg'));
    updateText(lines.join('\n'), 'Редовете са подредени (А-Я)!');
  };

  const encodeBase64 = () => {
    try {
      updateText(btoa(unescape(encodeURIComponent(text))), 'Base64 кодиране успешно!');
    } catch { alert('Грешка при кодирането.'); }
  };
  const decodeBase64 = () => {
    try {
      updateText(decodeURIComponent(escape(atob(text))), 'Base64 декодиране успешно!');
    } catch { alert('Невалиден Base64 формат.'); }
  };
  const formatJSON = () => {
    try {
      let parsed = JSON.parse(text);
      updateText(JSON.stringify(parsed, null, 4), 'JSON форматиран успешно!');
    } catch { alert('Невалиден JSON формат.'); }
  };

  const TooltipButton = ({ onClick, text: btnText, tip, isPro = false, isAi = false, isLoading = false }: { onClick: () => void; text: string; tip: string; isPro?: boolean; isAi?: boolean; isLoading?: boolean }) => {
    let btnStyle = '';
    if (isAi) {
      btnStyle = isLight
        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md';
    } else if (isPro) {
      btnStyle = isLight
        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
    } else {
      btnStyle = isLight
        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800';
    }

    return (
      <div className="relative group inline-block w-full">
        <button
          onClick={onClick}
          disabled={isLoading}
          className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${btnStyle}`}
        >
          {isLoading && (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          )}
          {isLoading ? t.processing : btnText}
        </button>
        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-help shadow-sm ${
          isAi ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-300 text-slate-700' : 'bg-slate-700 text-slate-300'
        }`}>
          i
        </span>
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal max-w-xs text-center z-50 pointer-events-none ${
          isLight ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {tip}
        </div>
      </div>
    );
  };

  const topWords = getTopWords();

  return (
    <main className={`min-h-screen transition-colors duration-300 p-4 md:p-10 font-sans flex flex-col items-center ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Хедър */}
        <header className={`flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h1 className={`text-3xl font-extrabold ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {t.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex p-1 rounded-lg border gap-1 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button onClick={() => setLang('bg')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${lang === 'bg' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                <span className="text-sm">🇧🇬</span> БГ
              </button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                <span className="text-sm">🇬🇧</span> EN
              </button>
              <button onClick={() => setLang('fr')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${lang === 'fr' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                <span className="text-sm">🇫🇷</span> FR
              </button>
              <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all flex items-center gap-1 ${lang === 'de' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                <span className="text-sm">🇩🇪</span> DE
              </button>
            </div>

            <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1 shadow-sm">
              {t.buyCoffee}
            </a>

            <button onClick={() => setIsLight(!isLight)} className={`text-xs px-3 py-2 rounded-lg transition-all border font-medium ${
              isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}>
              {isLight ? t.darkTheme : t.lightTheme}
            </button>
          </div>
        </header>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
          {[
            { label: t.chars, val: charCount },
            { label: t.noSpaces, val: charNoSpaces },
            { label: t.words, val: wordCount },
            { label: t.lines, val: lineCount },
            { label: t.paragraphs, val: paramCount },
            { label: t.readTime, val: `${readTime} мин` },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="text-lg font-bold text-blue-600">{item.val}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Зона за качване на файл */}
        <label className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer block transition-all ${
          isLight ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-slate-700' : 'border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-slate-200'
        }`}>
          <div className="text-xs md:text-sm font-semibold">{t.upload}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.uploadSub}</div>
          <input type="file" accept=".txt,.csv,.md,.html,.js,.json,.docx" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* ГЛАСОВИ ИНСТРУМЕНТИ И ЕКСПОРТ (БЕЗ UNDO/REDO) */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="space-x-2 flex items-center">
              <div className="relative group">
                <button onClick={toggleVoiceInput} className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${
                  isListening ? 'bg-rose-600 text-white border-rose-600 shadow-md animate-pulse' : isLight ? 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}>
                  {isListening ? t.voiceStop : t.voiceInput}
                </button>
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal w-56 bg-slate-900 text-slate-100 z-50 pointer-events-none">
                  {t.tips.voiceInput}
                </div>
              </div>

              <div className="relative group">
                <button onClick={toggleSpeech} className={`px-3 py-1.5 rounded-md transition-all font-semibold border flex items-center gap-1.5 ${
                  isSpeaking ? 'bg-amber-600 text-white border-amber-600 shadow-md animate-pulse' : isLight ? 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}>
                  {isSpeaking ? t.speakStop : t.speakText}
                </button>
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-normal w-56 bg-slate-900 text-slate-100 z-50 pointer-events-none">
                  {t.tips.speakText}
                </div>
              </div>
            </div>

            <div className="space-x-2 flex items-center">
              <button onClick={copyText} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.copy}</button>
              <button onClick={downloadFile} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.downloadTxt}</button>
              <button onClick={downloadDocx} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all shadow-sm">{t.downloadDocx}</button>
            </div>
          </div>

          {/* ПУЛСИРАЩ ПРОГРЕС БАР ЗА ЗАПИС/ЧЕТЕНЕ */}
          {(isListening || isSpeaking) && (
            <div className={`p-3.5 rounded-xl border flex flex-col space-y-2 text-xs font-semibold shadow-inner ${
              isListening ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping"></span>
                  {isListening ? t.voiceListeningMsg : t.voiceSpeakingMsg}
                </span>
                <span className="text-[10px] opacity-80">
                  {isListening ? 'REC • 16kHz' : 'TTS Audio'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full animate-pulse transition-all duration-300 ${
                  isListening ? 'bg-rose-500 w-full' : 'bg-amber-500 w-full'
                }`}></div>
              </div>
            </div>
          )}
        </div>

        {/* САМОСТОЯТЕЛНА ЛЕНТА ЗА UNDO / REDO И MARKDOWN */}
        <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          {/* ИЗОЛИРАНА UNDO / REDO СЕКЦИЯ */}
          <div className="flex items-center gap-1.5 border-r pr-3 border-slate-300 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">История:</span>
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Отмени последната промяна (Undo)"
            >
              {t.undo}
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Върни отменената промяна (Redo)"
            >
              {t.redo}
            </button>
          </div>

          {/* Markdown Бутони */}
          <div className="flex items-center gap-1.5 flex-1">
            <span className="font-semibold text-slate-500 mr-1 hidden sm:inline">{t.markdownTitle}</span>
            <button onClick={() => insertMarkdown('bold')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700">B</button>
            <button onClick={() => insertMarkdown('italic')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 italic rounded border border-slate-300 dark:border-slate-700">I</button>
            <button onClick={() => insertMarkdown('h1')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded border border-slate-300 dark:border-slate-700">H1</button>
            <button onClick={() => insertMarkdown('list')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700">• List</button>
          </div>

          <button onClick={() => setShowPreview(!showPreview)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm">
            {showPreview ? '✏️ Редактор' : t.previewTitle}
          </button>
        </div>

        {/* Текстова площ */}
        {!showPreview ? (
          <textarea
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder={t.placeholder}
            className={`w-full h-48 p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm resize-y transition-all ${
              isLight ? 'bg-white text-slate-900 border-slate-300 shadow-sm' : 'bg-slate-900/90 text-slate-100 border-slate-800'
            }`}
          />
        ) : (
          <div className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm font-sans whitespace-pre-wrap ${
            isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}>
            {text || 'Няма въведен текст за преглед.'}
          </div>
        )}

        {/* Честотен анализ с помощно каре */}
        {topWords.length > 0 && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-900 border-slate-800 text-amber-300'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-bold">{t.wordFreqTitle}</span>
              <span className="text-[10px] text-slate-500 italic">{t.wordFreqTip}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {topWords.map(([word, count], idx) => (
                <span key={idx} className="bg-amber-200 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-800 dark:text-slate-200">
                  "{word}": {count}x
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Запазена история с обяснение */}
        {savedHistory.length > 0 && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-500">{t.historyTitle}</span>
                <span className="text-[10px] text-slate-400 block">{t.historyTip}</span>
              </div>
              <button onClick={() => { localStorage.removeItem('textfix_history'); setSavedHistory([]); }} className="text-rose-500 hover:underline">
                {t.historyClear}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {savedHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => updateText(item, 'Текстът бе възстановен!')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded text-[11px] truncate max-w-[200px] border border-slate-200 dark:border-slate-700"
                >
                  {item.slice(0, 25)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Резултати */}
        {aiResult && (
          <div className={`p-4 rounded-xl space-y-3 border shadow-lg transition-all ${
            isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-slate-900 border-slate-700'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t.aiResultTitle}</span>
              <button 
                onClick={() => setAiResult('')} 
                className={`text-xs font-semibold px-2 py-1 rounded border transition-all ${
                  isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}>
                {t.closeResult}
              </button>
            </div>
            
            <textarea
              value={aiResult}
              readOnly
              className={`w-full h-48 p-4 rounded-xl border font-sans text-sm resize-y focus:outline-none ${
                isLight ? 'bg-white text-slate-900 border-blue-200' : 'bg-slate-950 text-slate-100 border-slate-800'
              }`}
            />

            <div className="flex flex-wrap gap-2 text-xs">
              <button 
                onClick={() => { navigator.clipboard.writeText(aiResult); showToast('Резултатът е копиран!'); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
                {t.copyResult}
              </button>
              <button 
                onClick={() => { updateText(aiResult, 'Главният текст е заменен с новия резултат!'); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
                {t.replaceText}
              </button>
            </div>
          </div>
        )}

        {/* ИНТЕЛИГЕНТНИ ИНСТРУМЕНТИ */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isLight ? 'bg-blue-50/40 border-blue-100' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t.aiTools}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <TooltipButton onClick={() => handleAiAction('summary')} text={t.aiSummary} tip={t.tips.aiSummary} isAi isLoading={loadingAction === 'summary'} />
            <TooltipButton onClick={() => handleAiAction('fix')} text={t.aiFix} tip={t.tips.aiFix} isAi isLoading={loadingAction === 'fix'} />
            <TooltipButton onClick={() => handleAiAction('expand')} text={t.aiExpand} tip={t.tips.aiExpand} isAi isLoading={loadingAction === 'expand'} />
            <TooltipButton onClick={() => handleAiAction('shorten')} text={t.aiShorten} tip={t.tips.aiShorten} isAi isLoading={loadingAction === 'shorten'} />
            <TooltipButton onClick={() => handleAiAction('simplify')} text={t.aiSimplify} tip={t.tips.aiSimplify} isAi isLoading={loadingAction === 'simplify'} />
            <TooltipButton onClick={() => handleAiAction('elevate')} text={t.aiElevate} tip={t.tips.aiElevate} isAi isLoading={loadingAction === 'elevate'} />
          </div>
        </div>

        {/* Търсене & Замяна */}
        <div className={`p-4 rounded-xl border space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.searchReplace}</div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder={t.findPlaceholder} value={findVal} onChange={(e) => setFindVal(e.target.value)} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`} />
            <input type="text" placeholder={t.replacePlaceholder} value={replaceVal} onChange={(e) => setReplaceVal(e.target.value)} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`} />
            <button onClick={handleReplace} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">{t.replaceBtn}</button>
          </div>
        </div>

        {/* Превод */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.transEngine}</div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <label>{t.engineLabel}</label>
              <select value={engine} onChange={(e) => setEngine(e.target.value)} className={`border text-xs px-2 py-1 rounded-md outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <option value="google">Google Translate</option>
                <option value="mymemory">MyMemory Engine</option>
                <option value="lingva">Lingva Open Engine</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => translateText('bg', 'en')} className={`border py-2 rounded-lg text-xs font-semibold transition-all ${
              isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
            }`}>{t.transEn}</button>
            <button onClick={() => translateText('en', 'bg')} className={`border py-2 rounded-lg text-xs font-semibold transition-all ${
              isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
            }`}>{t.transBg}</button>
            <button onClick={() => translateText('auto', 'de')} className={`border py-2 rounded-lg text-xs font-semibold transition-all ${
              isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
            }`}>{t.transDe}</button>
            <button onClick={() => translateText('auto', 'fr')} className={`border py-2 rounded-lg text-xs font-semibold transition-all ${
              isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/50'
            }`}>{t.transFr}</button>
          </div>
        </div>

        {/* Транслитерация */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.translit}</div>
          <div className="grid grid-cols-2 gap-2">
            <TooltipButton onClick={toLatin} text={t.cyrToLat} tip={t.tips.toLatin} />
            <TooltipButton onClick={toCyrillic} text={t.latToCyr} tip={t.tips.toCyrillic} />
          </div>
        </div>

        {/* Почистване и Форматиране */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.tools}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <TooltipButton onClick={makeBIG} text={t.uppercase} tip={t.tips.uppercase} />
            <TooltipButton onClick={makeSmall} text={t.lowercase} tip={t.tips.lowercase} />
            <TooltipButton onClick={capitalizeSentences} text={t.sentenceCase} tip={t.tips.sentenceCase} />
            <TooltipButton onClick={capitalizeTitleCase} text={t.titleCase} tip={t.tips.titleCase} />
            <TooltipButton onClick={makeSlug} text={t.slug} tip={t.tips.slug} />
            <TooltipButton onClick={stripHtmlTags} text={t.stripHtml} tip={t.tips.stripHtml} />
            <TooltipButton onClick={removeSpaces} text={t.removeSpaces} tip={t.tips.removeSpaces} />
            <TooltipButton onClick={removeDuplicateLines} text={t.removeDuplicates} tip={t.tips.removeDuplicateLines} />
            <TooltipButton onClick={removeEmptyLines} text={t.removeEmpty} tip={t.tips.removeEmptyLines} />
            <TooltipButton onClick={sortLines} text={t.sortLines} tip={t.tips.sortLines} />
            <button onClick={() => updateText('', t.clearAll)} className={`border text-xs py-2 rounded-lg transition-all col-span-2 sm:col-span-1 font-semibold ${
              isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
            }`}>
              {t.clearAll}
            </button>
          </div>
        </div>

        {/* PRO Инструменти */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.proTools}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TooltipButton onClick={encodeBase64} text={t.encodeBase64} tip={t.tips.encodeBase64} isPro />
            <TooltipButton onClick={decodeBase64} text={t.decodeBase64} tip={t.tips.decodeBase64} isPro />
            <TooltipButton onClick={formatJSON} text={t.formatJSON} tip={t.tips.formatJSON} isPro />
          </div>
        </div>

        {/* Футър */}
        <footer className={`pt-8 border-t text-center text-xs text-slate-500 space-y-3 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>TextFix Pro &copy; 2026 — Интелигентен текстов помощник & Редактор</div>
          <div>
            <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" className={`inline-block border px-4 py-2 rounded-full font-medium transition-all ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
            }`}>
              {t.buyCoffee} ☕
            </a>
          </div>
        </footer>

      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl transition-all animate-bounce z-50">
          {toastMsg}
        </div>
      )}
    </main>
  );
}