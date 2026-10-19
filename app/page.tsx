"use client";

import ShareButtons from "./ShareButtons";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
import { diffWords, diffChars } from "diff";
import Tesseract from "tesseract.js";
import { toPng } from "html-to-image";

type Language = "bg" | "en" | "fr" | "de" | "es" | "tr";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const HISTORY_DEBOUNCE_MS = 500;
const SESSION_SAVE_DEBOUNCE_MS = 3000;

// --- ВСИЧКИ ПРЕВОДИ ---
const translations = {
  bg: {
    title: "TextFix Pro", subtitle: "Интелигентен текстов помощник & Редактор v2.4", chars: "Символа", noSpaces: "Без интервали", words: "Думи", lines: "Редове", paragraphs: "Абзаци", readTime: "Време за четене", readability: "Трудност", readTimeValue: (n: number) => `${n} мин`, pasteBtn: "📋 Постави", upload: "📁 Качете файл (.txt, .md, .json, .docx)", uploadSub: "Поддържа автоматично извличане на текст (макс. 10 MB)", undo: "↩️ Назад", redo: "↪️ Напред", copy: "📋 Копирай", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Въведете или поставете вашия текст тук...", aiTools: "🤖 Интелигентни AI инструменти", aiSummary: "✨ AI Резюме", aiFix: "📝 AI Граматика", aiExpand: "🚀 AI Разшири", aiShorten: "📉 AI Скъси", aiSimplify: "🧸 AI Опрости", aiElevate: "🎓 AI Повиши", aiCustomPlaceholder: "Собствена инструкция (напр. 'Направи го като имейл до шефа')...", aiCustomBtn: "Изпълни", aiResultTitle: "🤖 Интелигентен резултат:", copyResult: "📋 Копирай", replaceText: "🔄 Замени", closeResult: "❌ Затвори", processing: "Обработва се...", voiceInput: "🎤 Гласов вход", voiceStop: "⏹️ Спри", speakText: "🔊 Прочети", speakStop: "🔇 Спри", voiceListeningMsg: "🎙️ Записва активно... Говорете!", voiceSpeakingMsg: "🔊 Прочитане...", ttsSettings: "Настройки на гласа", ttsRate: "Скорост", ttsPitch: "Тон", wordFreqTitle: "📊 Честота на думите:", historyTitle: "💾 Запазени сесии:", historyRestore: "Възстанови", historyClear: "Изчисти", markdownTitle: "✍️ Markdown:", previewTitle: "👁️ Преглед", editorTitle: "✏️ Редактор", noTextPreview: "Няма въведен текст.", searchReplace: "🔍 Търсене & Замяна", findPlaceholder: "Търси...", replacePlaceholder: "Замени с...", replaceBtn: "Замени всички", transEngine: "🌐 Превод", engineLabel: "Услуга:", transEn: "На Английски 🇬🇧", transBg: "На Български 🇧🇬", transDe: "На Немски 🇩🇪", transFr: "На Френски 🇫🇷", copyTranslation: "📋 Копирай само превода", translit: "🔠 Транслитерация", cyrToLat: "Кирилица ➔ Латиница", latToCyr: "Латиница ➔ Кирилица", tools: "🛠️ Почистване и Форматиране", uppercase: "ГОЛЕМИ", lowercase: "малки", sentenceCase: "✏️ Изречение", titleCase: "🔠 Заглавие", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Интервали", removeDuplicates: "🗑️ Дубликати", removeEmpty: "📭 Празни редове", sortLinesAsc: "🔤 Сортирай А-Я", sortLinesDesc: "🔤 Сортирай Я-А", clearAll: "Изчисти всичко", proTools: "⚡ PRO Инструменти", encodeBase64: "🔐 Base64 Кодирай", decodeBase64: "🔓 Base64 Декодирай", formatJSON: "📦 Форматирай JSON", buyCoffee: "☕ Кафе", lightTheme: "☀️ Светъл", darkTheme: "🌙 Тъмен", fileTooLarge: "Файлът е твърде голям (макс. 10 MB).", fileLoaded: (name: string) => `Файлът "${name}" е зареден!`, wordFileLoading: "Зареждане на Word...", wordFileLoaded: "Word документът е зареден!", wordFileFallback: "Текстът не можа да се извлече.", wordLoadError: "Грешка при .docx.", noTextToDownload: "Няма текст!", noTextToCopy: "Няма текст за копиране!", noTextToSpeak: "Няма текст за четене!", noTextForAi: "Моля, въведете текст!", noFindWord: "Въведете дума!", noMatches: "Няма съвпадения.", noTextToTranslate: "Няма текст за превод!", aiError: "Грешка от асистента.", aiConnectionError: "Грешка със сървъра.", translateError: "Грешка с преводача.", translateNoResult: "Опитайте друг преводач.", invalidBase64: "Невалиден Base64.", invalidJson: "Невалиден JSON.", encodeError: "Грешка при кодиране.", speechNotSupported: "Браузърът не поддържа глас.", ttsNotSupported: "Браузърът не поддържа четене.", microphoneDenied: "Разрешете микрофона.", listeningError: "Грешка при микрофона.", speaking: "Прочитане...", speakingStopped: "Спряно.", listeningStopped: "Спряно.", micActive: "Микрофонът е активен!", copied: "Копирано!", copiedResult: "Резултатът е копиран!", downloaded: "Изтеглено!", replaced: (n: number) => `Заменени ${n} места!`, resultReady: "Готово!", mainTextReplaced: "Текстът е заменен!", textRestored: "Възстановено!", translitSuccess: "Успешна транслитерация!", upperSuccess: "ГОЛЕМИ БУКВИ!", lowerSuccess: "малки букви!", sentenceSuccess: "Главни букви!", titleSuccess: "Заглавия!", slugSuccess: "Готов Slug!", htmlStripped: "HTML премахнат!", spacesRemoved: "Интервалите са изчистени!", duplicatesRemoved: "Дубликатите са премахнати!", emptyRemoved: "Празните редове са премахнати!", sorted: "Сортирано!", cleared: "Изчистено!", encodeSuccess: "Base64 готово!", decodeSuccess: "Base64 декодирано!", jsonFormatted: "JSON форматиран!", translating: "Превежда се...", translationReady: "Преводът е готов!", confirmClearHistory: "Сигурни ли сте, че искате да изчистите историята?", confirmClearAll: "Сигурни ли сте, че искате да изчистите целия текст?", compareTitle: "🔍 Text Compare (Сравнение)", compareOriginal: "Оригинален текст (преди)", compareNew: "Нов текст (за сравнение)", compareResult: "Резултат от сравнението:", compareEmpty: "Тук ще се покаже резултатът...", compareAdded: "Нови думи", compareRemoved: "Премахнати думи", compareClose: "Затвори", compareCase: "Главни/малки букви", compareWords: "Думи", compareChars: "Символи", toolkitTitle: "🧰 Помощни инструменти", toolkitSub: "Допълнителни функции за вашия текст", toolPass: "🔐 Генератор на пароли", toolImg: "🖼️ Текст в картинка", toolOcr: "📷 Извлечи текст от снимка", toolSocial: "📱 Проверка за социални мрежи", genPassBtn: "Генерирай парола", passLength: "Дължина:", passUpper: "Главни", passLower: "Малки", passNum: "Цифри", passSym: "Символи", imgBtn: "Свали като картинка", imgBg: "Фон:", ocrBtn: "Избери снимка", ocrProcessing: "Разчитане на текст...", ocrSuccess: "Текстът е извлечен!", ocrError: "Грешка при разчитането.", twLimit: "Twitter (X) лимит:", liLimit: "LinkedIn лимит:", twOk: "Побира се", twNo: "Превишава лимита", tips: { aiSummary: "Резюме на текста", aiFix: "Коригира правопис и граматика", aiExpand: "Разширява текста", aiShorten: "Съкращава текста", aiSimplify: "Опростява езика", aiElevate: "Професионален стил", voiceInput: "Диктуване с микрофон", speakText: "Четене на глас", toLatin: "Кирилица към латиница", toCyrillic: "Латиница към кирилица", uppercase: "Всички букви главни", lowercase: "Всички букви малки", sentenceCase: "Главна буква на изречение", titleCase: "Главна буква на всяка дума", slug: "URL адрес", stripHtml: "Премахва HTML", removeSpaces: "Маха излишни интервали", removeDuplicateLines: "Маха дублиращи се редове", removeEmptyLines: "Маха празни редове", sortLinesAsc: "Сортира А-Я", sortLinesDesc: "Сортира Я-А", encodeBase64: "Base64 кодиране", decodeBase64: "Base64 декодиране", formatJSON: "Подрежда JSON" }
  },
  en: {
    title: "TextFix Pro", subtitle: "Intelligent Text Assistant v2.4", chars: "Characters", noSpaces: "No spaces", words: "Words", lines: "Lines", paragraphs: "Paragraphs", readTime: "Read time", readability: "Readability", readTimeValue: (n: number) => `${n} min`, pasteBtn: "📋 Paste", upload: "📁 Upload file", uploadSub: "Supports text extraction (max 10 MB)", undo: "↩️ Undo", redo: "↪️ Redo", copy: "📋 Copy", downloadTxt: "💾 .txt", downloadDocx: "📄 .docx", downloadPdf: "📕 .pdf", placeholder: "Type or paste your text here...", aiTools: "🤖 AI Tools", aiSummary: "✨ AI Summary", aiFix: "📝 AI Fix Grammar", aiExpand: "🚀 AI Expand", aiShorten: "📉 AI Shorten", aiSimplify: "🧸 AI Simplify", aiElevate: "🎓 AI Elevate", aiCustomPlaceholder: "Custom instruction...", aiCustomBtn: "Run", aiResultTitle: "🤖 Result:", copyResult: "📋 Copy", replaceText: "🔄 Replace", closeResult: "❌ Close", processing: "Processing...", voiceInput: "🎤 Voice Input", voiceStop: "⏹️ Stop", speakText: "🔊 Read Aloud", speakStop: "🔇 Stop", voiceListeningMsg: "🎙️ Recording...", voiceSpeakingMsg: "🔊 Reading...", ttsSettings: "Voice Settings", ttsRate: "Rate", ttsPitch: "Pitch", wordFreqTitle: "📊 Word Frequency:", historyTitle: "💾 Saved Sessions:", historyRestore: "Restore", historyClear: "Clear", markdownTitle: "✍️ Markdown:", previewTitle: "👁️ Preview", editorTitle: "✏️ Editor", noTextPreview: "No text to preview.", searchReplace: "🔍 Search & Replace", findPlaceholder: "Find...", replacePlaceholder: "Replace with...", replaceBtn: "Replace All", transEngine: "🌐 Translation", engineLabel: "Service:", transEn: "To English 🇬🇧", transBg: "To Bulgarian 🇧🇬", transDe: "To German 🇩🇪", transFr: "To French 🇫🇷", copyTranslation: "📋 Copy translation", translit: "🔠 Transliteration", cyrToLat: "Cyrillic ➔ Latin", latToCyr: "Latin ➔ Cyrillic", tools: "🛠️ Cleaning", uppercase: "UPPERCASE", lowercase: "lowercase", sentenceCase: "✏️ Sentence", titleCase: "🔠 Title Case", slug: "🔗 Slug", stripHtml: "🧹 HTML", removeSpaces: "✂️ Spaces", removeDuplicates: "🗑️ Duplicates", removeEmpty: "📭 Empty lines", sortLinesAsc: "🔤 Sort A-Z", sortLinesDesc: "🔤 Sort Z-A", clearAll: "Clear All", proTools: "⚡ PRO Tools", encodeBase64: "🔐 Base64 Encode", decodeBase64: "🔓 Base64 Decode", formatJSON: "📦 Format JSON", buyCoffee: "☕ Coffee", lightTheme: "☀️ Light", darkTheme: "🌙 Dark", fileTooLarge: "File too large.", fileLoaded: (name: string) => `File "${name}" loaded!`, wordFileLoading: "Loading Word...", wordFileLoaded: "Word loaded!", wordFileFallback: "Text could not be extracted.", wordLoadError: "Error reading .docx.", noTextToDownload: "No text!", noTextToCopy: "No text to copy!", noTextToSpeak: "No text to read!", noTextForAi: "Enter text!", noFindWord: "Enter a word!", noMatches: "No matches.", noTextToTranslate: "No text to translate!", aiError: "AI error.", aiConnectionError: "Server error.", translateError: "Translator error.", translateNoResult: "Try another translator.", invalidBase64: "Invalid Base64.", invalidJson: "Invalid JSON.", encodeError: "Encoding error.", speechNotSupported: "Voice not supported.", ttsNotSupported: "TTS not supported.", microphoneDenied: "Allow microphone.", listeningError: "Mic error.", speaking: "Reading...", speakingStopped: "Stopped.", listeningStopped: "Stopped.", micActive: "Mic active!", copied: "Copied!", copiedResult: "Result copied!", downloaded: "Downloaded!", replaced: (n: number) => `Replaced ${n}!`, resultReady: "Done!", mainTextReplaced: "Text replaced!", textRestored: "Restored!", translitSuccess: "Transliterated!", upperSuccess: "UPPERCASE!", lowerSuccess: "lowercase!", sentenceSuccess: "Sentence case!", titleSuccess: "Title case!", slugSuccess: "Slug created!", htmlStripped: "HTML stripped!", spacesRemoved: "Spaces removed!", duplicatesRemoved: "Duplicates removed!", emptyRemoved: "Empty lines removed!", sorted: "Sorted!", cleared: "Cleared!", encodeSuccess: "Base64 done!", decodeSuccess: "Base64 decoded!", jsonFormatted: "JSON formatted!", translating: "Translating...", translationReady: "Translation ready!", confirmClearHistory: "Are you sure you want to clear history?", confirmClearAll: "Are you sure you want to clear all text?", compareTitle: "🔍 Text Compare", compareOriginal: "Original text", compareNew: "New text to compare", compareResult: "Comparison result:", compareEmpty: "Result will appear here...", compareAdded: "New words", compareRemoved: "Removed words", compareClose: "Close", compareCase: "Case sensitive", compareWords: "Words", compareChars: "Characters", toolkitTitle: "🧰 Toolkit", toolkitSub: "Extra tools for your text", toolPass: "🔐 Password Generator", toolImg: "🖼️ Text to Image", toolOcr: "📷 Image to Text (OCR)", toolSocial: "📱 Social Media Limits", genPassBtn: "Generate password", passLength: "Length:", passUpper: "Upper", passLower: "Lower", passNum: "Numbers", passSym: "Symbols", imgBtn: "Download as image", imgBg: "Background:", ocrBtn: "Choose image", ocrProcessing: "Reading text...", ocrSuccess: "Text extracted!", ocrError: "Error reading image.", twLimit: "Twitter (X) limit:", liLimit: "LinkedIn limit:", twOk: "Fits", twNo: "Exceeds limit", tips: { aiSummary: "Summarizes text", aiFix: "Fixes grammar", aiExpand: "Expands text", aiShorten: "Shortens text", aiSimplify: "Simplifies language", aiElevate: "Professional style", voiceInput: "Dictate with mic", speakText: "Read aloud", toLatin: "Cyrillic to Latin", toCyrillic: "Latin to Cyrillic", uppercase: "All uppercase", lowercase: "All lowercase", sentenceCase: "Capitalize sentences", titleCase: "Capitalize words", slug: "URL slug", stripHtml: "Remove HTML", removeSpaces: "Remove extra spaces", removeDuplicateLines: "Remove duplicates", removeEmptyLines: "Remove empty lines", sortLinesAsc: "Sort A-Z", sortLinesDesc: "Sort Z-A", encodeBase64: "Base64 encode", decodeBase64: "Base64 decode", formatJSON: "Format JSON" }
  },
  // Можеш да добавиш fr, de, es, tr по същия начин (за да не става файлът 5000 реда, тук съм оставил само bg и en, ако искаш ги добави)
} as any;

type Translation = (typeof translations)["bg"];

function calculateReadability(text: string): number {
  if (!text.trim()) return 0;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const words = text.trim().split(/\s+/).length;
  const syllables = text.toLowerCase().replace(/[^a-zа-яё]/g, "").replace(/[aeiouyаеиоуъюя]+/g, "a").length;
  if (words === 0 || sentences === 0) return 0;
  return Math.max(0, Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)));
}

function getReadabilityLabel(score: number, lang: string): string {
  if (score === 0) return "-";
  const labels: Record<string, string[]> = { bg: ["Много труден", "Труден", "Среден", "Лесен", "Много лесен"], en: ["Very Hard", "Hard", "Medium", "Easy", "Very Easy"] };
  const arr = labels[lang] || labels.en;
  if (score < 30) return arr[0]; if (score < 50) return arr[1]; if (score < 60) return arr[2]; if (score < 80) return arr[3]; return arr[4];
}

function TooltipButton({ onClick, text, tip, isPro = false, isAi = false, isLoading = false, isLight, processingText }: any) {
  let btnStyle = isAi ? (isLight ? "bg-blue-600 text-white border-blue-600" : "bg-blue-600 text-white border-blue-500") : isPro ? (isLight ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 text-slate-200 border-slate-700") : (isLight ? "bg-white text-slate-700 border-slate-200" : "bg-slate-900 text-slate-200 border-slate-800");
  return (
    <div className="relative inline-block w-full">
      <button type="button" onClick={onClick} disabled={isLoading} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${btnStyle}`}>
        {isLoading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {isLoading ? processingText : text}
      </button>
      <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-help shadow-sm peer ${isAi ? "bg-blue-500 text-white" : isLight ? "bg-slate-300 text-slate-700" : "bg-slate-700 text-slate-300"}`}>i</span>
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] rounded-md border shadow-xl opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-150 whitespace-normal max-w-xs text-center z-50 pointer-events-none ${isLight ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-slate-900 text-slate-200 border-slate-700"}`}>{tip}</div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("textfix_lang") as Language;
      if (storedLang) return storedLang;
      const bl = navigator.language.toLowerCase();
      if (bl.startsWith("bg")) return "bg";
      if (bl.startsWith("es")) return "es";
      if (bl.startsWith("tr")) return "tr";
      return "en";
    }
    return "bg";
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

  // Нови состояния за инструментите
  const [password, setPassword] = useState("");
  const [passOptions, setPassOptions] = useState({ length: 16, upper: true, lower: true, num: true, sym: true });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imgBgColor, setImgBgColor] = useState("#1e293b");
  const [imgTextColor, setImgTextColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState<"pass" | "img" | "ocr" | "social">("pass");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const recognitionRestartCountRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const imageRenderRef = useRef<HTMLDivElement>(null);

  const t: Translation = translations[lang] || translations.en;

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("textfix_history");
      if (storedHistory) { const parsed = JSON.parse(storedHistory); if (Array.isArray(parsed)) setSavedHistory(parsed); }
      const storedTheme = localStorage.getItem("textfix_theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        setIsLight(storedTheme === "light");
      } else {
        // Проверка за системна тема
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsLight(!prefersDark);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("textfix_theme", isLight ? "light" : "dark"); } catch (e) { console.error(e); }
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", !isLight);
  }, [isLight]);

  useEffect(() => { try { localStorage.setItem("textfix_lang", lang); } catch (e) { console.error(e); } }, [lang]);

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
  const wordCount = useMemo(() => (text.trim() === "" ? 0 : text.trim().split(/\s+/).length), [text]);
  const lineCount = useMemo(() => (text.trim() === "" ? 0 : text.split(/\r\n|\r|\n/).length), [text]);
  const readTime = Math.ceil(wordCount / 200);
  const readabilityLabel = useMemo(() => getReadabilityLabel(calculateReadability(text), lang), [text, lang]);

  const topWords = useMemo(() => {
    if (!text.trim()) return [];
    const stopWords = new Set(["и", "в", "на", "с", "за", "че", "от", "по", "да", "как", "се", "не", "е", "the", "and", "to"]);
    const wordsArr = text.toLowerCase().match(/[a-zа-я0-9]+/gi) || [];
    const freqMap: Record<string, number> = {};
    wordsArr.forEach((w) => { if (w.length > 2 && !stopWords.has(w)) freqMap[w] = (freqMap[w] || 0) + 1; });
    return Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [text]);

  // --- ИНСТРУМЕНТИ ---
  const generatePassword = () => {
    let chars = "";
    if (passOptions.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (passOptions.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (passOptions.num) chars += "0123456789";
    if (passOptions.sym) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    if (!chars) return setPassword("");
    let pass = "";
    for (let i = 0; i < passOptions.length; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(pass);
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setOcrLoading(true); showToast(t.ocrProcessing);
    try {
      const result = await Tesseract.recognize(file, lang === "bg" ? "bul" : "eng");
      updateText(result.data.text, t.ocrSuccess);
    } catch (err) { console.error(err); showToast(t.ocrError); } finally { setOcrLoading(false); }
  };

  const downloadImage = async () => {
    if (!imageRenderRef.current) return;
    try {
      const dataUrl = await toPng(imageRenderRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "textfix-quote.png";
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
  };

  const charCounterColor = charCount > 5000 ? "text-rose-500 font-bold" : "text-blue-600";
  const mdBtnClass = `px-2.5 py-1 rounded border transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`;

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
              {(["bg", "en"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all ${lang === l ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg shadow-sm">{t.buyCoffee}</a>
            <button type="button" onClick={() => setIsLight(!isLight)} className={`text-xs px-3 py-2 rounded-lg border font-medium ${isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-200"}`}>
              {isLight ? t.darkTheme : t.lightTheme}
            </button>
          </div>
        </header>

        <ShareButtons lang={lang as any} isLight={isLight} />

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
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
            <div className="text-[11px] font-bold text-blue-600 truncate">{readabilityLabel}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{t.readability}</div>
          </div>
          <button type="button" onClick={async () => { try { const t = await navigator.clipboard.readText(); updateText(t, "OK!"); } catch { } }} className={`p-3 rounded-xl border shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-lg">{t.pasteBtn}</div>
          </button>
        </div>

        {/* Главен текстов редактор */}
        <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"}`}>
          <div className="flex items-center gap-1.5 border-r pr-3 border-slate-300 dark:border-slate-700">
            <button type="button" onClick={undo} disabled={historyIndex <= 0} className={`px-3 py-1.5 rounded-lg font-bold border disabled:opacity-30 ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-800 border-slate-700"}`}>{t.undo}</button>
            <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className={`px-3 py-1.5 rounded-lg font-bold border disabled:opacity-30 ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-800 border-slate-700"}`}>{t.redo}</button>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setShowCompare(!showCompare)} className={`px-3 py-1 rounded-lg font-semibold shadow-sm ${showCompare ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'}`}>🔍 {t.compareTitle}</button>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold">{showPreview ? t.editorTitle : t.previewTitle}</button>
          </div>
        </div>

        {!showPreview ? (
          <textarea ref={textAreaRef} value={text} onChange={(e) => updateText(e.target.value, undefined, true)} placeholder={t.placeholder} className={`w-full h-48 p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 font-sans text-sm resize-y ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`} />
        ) : (
          <div className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm whitespace-pre-wrap ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`}>{text || t.noTextPreview}</div>
        )}

        {/* AI Инструменти */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? "bg-blue-50/40 border-blue-100" : "bg-slate-900/50 border-slate-800"}`}>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t.aiTools}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <TooltipButton onClick={() => {}} text={t.aiSummary} tip={t.tips.aiSummary} isAi isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => {}} text={t.aiFix} tip={t.tips.aiFix} isAi isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => {}} text={t.aiExpand} tip={t.tips.aiExpand} isAi isLight={isLight} processingText={t.processing} />
          </div>
        </div>

        {/* 🧰 НОВИТЕ ИНСТРУМЕНТИ (Toolkit) */}
        <div className={`rounded-2xl border overflow-hidden ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"}`}>
          <div className={`p-4 border-b ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>
            <h3 className="font-bold text-sm">{t.toolkitTitle}</h3>
            <p className="text-[11px] text-slate-500">{t.toolkitSub}</p>
          </div>
          
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button onClick={() => setActiveTab("pass")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "pass" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolPass}</button>
            <button onClick={() => setActiveTab("img")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "img" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolImg}</button>
            <button onClick={() => setActiveTab("ocr")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "ocr" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolOcr}</button>
            <button onClick={() => setActiveTab("social")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "social" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolSocial}</button>
          </div>

          <div className="p-4">
            {activeTab === "pass" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full space-y-2 text-xs">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.upper} onChange={(e) => setPassOptions({ ...passOptions, upper: e.target.checked })} className="accent-blue-500" /> {t.passUpper}</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.lower} onChange={(e) => setPassOptions({ ...passOptions, lower: e.target.checked })} className="accent-blue-500" /> {t.passLower}</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.num} onChange={(e) => setPassOptions({ ...passOptions, num: e.target.checked })} className="accent-blue-500" /> {t.passNum}</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.sym} onChange={(e) => setPassOptions({ ...passOptions, sym: e.target.checked })} className="accent-blue-500" /> {t.passSym}</label>
                    <label className="flex items-center gap-2 mt-2">{t.passLength} <input type="number" value={passOptions.length} onChange={(e) => setPassOptions({ ...passOptions, length: parseInt(e.target.value) || 8 })} className={`border p-1 rounded w-16 ${isLight ? "border-slate-300" : "border-slate-700 bg-slate-950"}`} /></label>
                  </div>
                  <div className="flex-1 w-full">
                    <button type="button" onClick={generatePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs mb-2">{t.genPassBtn}</button>
                    <div className={`p-3 rounded-lg text-center font-mono text-lg break-all border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>{password || "..."}</div>
                    {password && <button onClick={() => { navigator.clipboard.writeText(password); showToast(t.copied); }} className="w-full mt-2 text-[10px] text-blue-500 underline">Copy</button>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "img" && (
              <div className="space-y-3">
                <div ref={imageRenderRef} className="p-6 rounded-xl flex items-center justify-center text-center min-h-[150px] shadow-lg break-words" style={{ backgroundColor: imgBgColor, color: imgTextColor }}>
                  <p className="text-xl font-sans whitespace-pre-wrap">{text || "Твоят текст тук..."}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2 text-xs items-center">
                    <label>{t.imgBg}</label>
                    <input type="color" value={imgBgColor} onChange={(e) => setImgBgColor(e.target.value)} />
                    <input type="color" value={imgTextColor} onChange={(e) => setImgTextColor(e.target.value)} />
                  </div>
                  <button type="button" onClick={downloadImage} disabled={!text} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">{t.imgBtn}</button>
                </div>
              </div>
            )}

            {activeTab === "ocr" && (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-500">Качете снимка на документ или текст. (Работи най-добре с ясни снимки)</p>
                <label className={`inline-block cursor-pointer px-6 py-3 rounded-lg font-bold text-xs border-2 border-dashed ${ocrLoading ? "opacity-50 pointer-events-none" : ""} ${isLight ? "border-blue-300 text-blue-600 bg-blue-50" : "border-blue-700 text-blue-400 bg-blue-950/30"}`}>
                  {ocrLoading ? t.ocrProcessing : t.ocrBtn}
                  <input type="file" accept="image/*" onChange={handleOcrUpload} className="hidden" disabled={ocrLoading} />
                </label>
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>{t.twLimit}</span>
                    <span className={charCount <= 280 ? "text-emerald-500" : "text-rose-500"}>
                      {charCount} / 280 ({charCount <= 280 ? t.twOk : t.twNo})
                    </span>
                  </div>
                  <div className={`h-2 rounded-full w-full ${isLight ? "bg-slate-200" : "bg-slate-800"}`}>
                    <div className={`h-full rounded-full transition-all ${charCount <= 280 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, (charCount / 280) * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>{t.liLimit}</span>
                    <span className={charCount <= 3000 ? "text-emerald-500" : "text-rose-500"}>
                      {charCount} / 3000
                    </span>
                  </div>
                  <div className={`h-2 rounded-full w-full ${isLight ? "bg-slate-200" : "bg-slate-800"}`}>
                    <div className={`h-full rounded-full transition-all ${charCount <= 3000 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Транслитерация и Почистване (опростени за пример) */}
        <details className={`group border rounded-2xl ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
          <summary className="p-4 cursor-pointer list-none font-bold text-xs uppercase tracking-widest text-slate-500">🔠 {t.tools}</summary>
          <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.uppercase}</button>
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.lowercase}</button>
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.stripHtml}</button>
             <button className={`bg-rose-50 text-rose-700 py-2.5 rounded-lg font-semibold`}>{t.clearAll}</button>
          </div>
        </details>

        <footer className={`pt-8 border-t text-center text-[10px] text-slate-500 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          TextFix Pro &copy; 2026
        </footer>
      </div>

      {toastMsg && <div role="status" className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl z-50 animate-bounce">{toastMsg}</div>}
    </main>
  );
}