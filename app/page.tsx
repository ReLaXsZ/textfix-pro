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
import { translations } from "./translations";

type Language = "bg" | "en" | "fr" | "de" | "es" | "tr";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const HISTORY_DEBOUNCE_MS = 500;
const SESSION_SAVE_DEBOUNCE_MS = 3000;

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
  const labels: Record<string, string[]> = { bg: ["Много труден", "Труден", "Среден", "Лесен", "Много лесен"], en: ["Very Hard", "Hard", "Medium", "Easy", "Very Easy"], fr: ["Très difficile", "Difficile", "Moyen", "Facile", "Très facile"], de: ["Sehr schwer", "Schwer", "Mittel", "Einfach", "Sehr einfach"], es: ["Muy difícil", "Difícil", "Medio", "Fácil", "Muy fácil"], tr: ["Çok zor", "Zor", "Orta", "Kolay", "Çok kolay"] };
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
      if (bl.startsWith("fr")) return "fr";
      if (bl.startsWith("de")) return "de";
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

  const t: any = translations[lang] || translations.en;

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("textfix_history");
      if (storedHistory) { const parsed = JSON.parse(storedHistory); if (Array.isArray(parsed)) setSavedHistory(parsed); }
      const storedTheme = localStorage.getItem("textfix_theme");
      if (storedTheme === "light" || storedTheme === "dark") setIsLight(storedTheme === "light");
      else { const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; setIsLight(!prefersDark); }
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
    const stopWords = new Set(["и", "в", "на", "с", "за", "че", "от", "по", "да", "как", "се", "не", "е", "the", "and", "to", "of", "a", "in", "is", "it"]);
    const wordsArr = text.toLowerCase().match(/[a-zа-я0-9]+/gi) || [];
    const freqMap: Record<string, number> = {};
    wordsArr.forEach((w) => { if (w.length > 2 && !stopWords.has(w)) freqMap[w] = (freqMap[w] || 0) + 1; });
    return Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [text]);

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
      link.download = "textfix.png"; link.href = dataUrl; link.click();
    } catch (err) { console.error(err); }
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

  const charCounterColor = charCount > 5000 ? "text-rose-500 font-bold" : "text-blue-600";
  const mdBtnClass = `px-2.5 py-1 rounded border transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`;

  return (
    <main className={`min-h-screen transition-colors duration-300 p-4 md:p-10 font-sans flex flex-col items-center ${isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"}`}>
      <div className="w-full max-w-4xl space-y-6">
        <header className={`flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
          <div>
            <h1 className={`text-3xl font-extrabold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.title}</h1>
            <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex p-1 rounded-lg border gap-1 ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
              {(["bg", "en", "fr", "de", "es", "tr"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={`px-2 py-1 text-xs rounded-md font-bold ${lang === l ? "bg-blue-600 text-white" : "text-slate-500"}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button type="button" onClick={() => setIsLight(!isLight)} className={`text-xs px-3 py-2 rounded-lg border font-medium ${isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-700"}`}>{isLight ? t.darkTheme : t.lightTheme}</button>
          </div>
        </header>

        <ShareButtons lang={lang as any} isLight={isLight} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className={`text-lg font-bold ${charCounterColor}`}>{charCount}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.chars}</div></div>
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg font-bold text-blue-600">{wordCount}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.words}</div></div>
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg font-bold text-blue-600">{lineCount}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.lines}</div></div>
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg font-bold text-blue-600">{readTime}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.readTime}</div></div>
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-[11px] font-bold text-blue-600 truncate">{readabilityLabel}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.readability}</div></div>
          <button type="button" onClick={async () => { try { const t = await navigator.clipboard.readText(); updateText(t, "OK!"); } catch { } }} className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg">{t.pasteBtn}</div></button>
        </div>

        <label className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer block ${isLight ? "border-blue-300 bg-blue-50/50" : "border-blue-500/30 bg-blue-950/20"}`}>
          <div className="text-xs md:text-sm font-semibold">{t.upload}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.uploadSub}</div>
          <input type="file" accept=".txt,.csv,.md,.html,.js,.json,.docx" className="hidden" />
        </label>

        <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
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
          <textarea ref={textAreaRef} value={text} onChange={(e) => updateText(e.target.value, undefined, true)} placeholder={t.placeholder} className={`w-full h-48 p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 text-sm resize-y ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`} />
        ) : (
          <div className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm whitespace-pre-wrap ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`}>{text || t.noTextPreview}</div>
        )}

        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? "bg-blue-50/40 border-blue-100" : "bg-slate-900/50 border-slate-800"}`}>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t.aiTools}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <TooltipButton onClick={() => {}} text={t.aiSummary} tip={t.tips.aiSummary} isAi isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => {}} text={t.aiFix} tip={t.tips.aiFix} isAi isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={() => {}} text={t.aiExpand} tip={t.tips.aiExpand} isAi isLight={isLight} processingText={t.processing} />
          </div>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
          <div className={`p-4 border-b ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}><h3 className="font-bold text-sm">{t.toolkitTitle}</h3></div>
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button onClick={() => setActiveTab("pass")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "pass" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolPass}</button>
            <button onClick={() => setActiveTab("img")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "img" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolImg}</button>
            <button onClick={() => setActiveTab("ocr")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "ocr" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolOcr}</button>
            <button onClick={() => setActiveTab("social")} className={`flex-1 py-3 px-2 text-center border-b-2 ${activeTab === "social" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}>{t.toolSocial}</button>
          </div>
          <div className="p-4">
            {activeTab === "pass" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full space-y-2 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.upper} onChange={(e) => setPassOptions({ ...passOptions, upper: e.target.checked })} /> {t.passUpper}</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.lower} onChange={(e) => setPassOptions({ ...passOptions, lower: e.target.checked })} /> {t.passLower}</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.num} onChange={(e) => setPassOptions({ ...passOptions, num: e.target.checked })} /> {t.passNum}</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={passOptions.sym} onChange={(e) => setPassOptions({ ...passOptions, sym: e.target.checked })} /> {t.passSym}</label>
                </div>
                <div className="flex-1 w-full">
                  <button type="button" onClick={generatePassword} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-xs mb-2">{t.genPassBtn}</button>
                  <div className={`p-3 rounded-lg text-center font-mono text-lg break-all border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>{password || "..."}</div>
                </div>
              </div>
            )}
            {activeTab === "img" && (
              <div className="space-y-3">
                <div ref={imageRenderRef} className="p-6 rounded-xl flex items-center justify-center text-center min-h-[150px] shadow-lg break-words" style={{ backgroundColor: imgBgColor, color: imgTextColor }}><p className="text-xl whitespace-pre-wrap">{text || "Text..."}</p></div>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2 text-xs items-center"><label>{t.imgBg}</label><input type="color" value={imgBgColor} onChange={(e) => setImgBgColor(e.target.value)} /><input type="color" value={imgTextColor} onChange={(e) => setImgTextColor(e.target.value)} /></div>
                  <button type="button" onClick={downloadImage} disabled={!text} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">{t.imgBtn}</button>
                </div>
              </div>
            )}
            {activeTab === "ocr" && (
              <div className="space-y-3 text-center">
                <label className={`inline-block cursor-pointer px-6 py-3 rounded-lg font-bold text-xs border-2 border-dashed ${ocrLoading ? "opacity-50 pointer-events-none" : ""} ${isLight ? "border-blue-300 text-blue-600 bg-blue-50" : "border-blue-700 text-blue-400 bg-blue-950/30"}`}>
                  {ocrLoading ? t.ocrProcessing : t.ocrBtn}
                  <input type="file" accept="image/*" onChange={handleOcrUpload} className="hidden" disabled={ocrLoading} />
                </label>
              </div>
            )}
            {activeTab === "social" && (
              <div className="space-y-4 text-sm">
                <div><div className="flex justify-between font-bold mb-1"><span>{t.twLimit}</span><span className={charCount <= 280 ? "text-emerald-500" : "text-rose-500"}>{charCount} / 280 ({charCount <= 280 ? t.twOk : t.twNo})</span></div><div className={`h-2 rounded-full w-full ${isLight ? "bg-slate-200" : "bg-slate-800"}`}><div className={`h-full rounded-full ${charCount <= 280 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, (charCount / 280) * 100)}%` }}></div></div></div>
                <div><div className="flex justify-between font-bold mb-1"><span>{t.liLimit}</span><span className={charCount <= 3000 ? "text-emerald-500" : "text-rose-500"}>{charCount} / 3000</span></div><div className={`h-2 rounded-full w-full ${isLight ? "bg-slate-200" : "bg-slate-800"}`}><div className={`h-full rounded-full ${charCount <= 3000 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}></div></div></div>
              </div>
            )}
          </div>
        </div>

        <details className={`group border rounded-2xl ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-xs uppercase text-slate-500">
            <div>🔠 {t.tools}</div>
            <span className="transition group-open:rotate-180 text-slate-400">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button type="button" onClick={makeBIG} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.uppercase}</button>
            <button type="button" onClick={makeSmall} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.lowercase}</button>
            <button type="button" onClick={capitalizeSentences} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.sentenceCase}</button>
            <button type="button" onClick={capitalizeTitleCase} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.titleCase}</button>
            <button type="button" onClick={makeSlug} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.slug}</button>
            <button type="button" onClick={stripHtmlTags} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.stripHtml}</button>
            <button type="button" onClick={removeSpaces} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.removeSpaces}</button>
            <button type="button" onClick={removeDuplicateLines} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.removeDuplicates}</button>
            <button type="button" onClick={removeEmptyLines} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.removeEmpty}</button>
            <button type="button" onClick={sortLinesAsc} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.sortLinesAsc}</button>
            <button type="button" onClick={sortLinesDesc} className={`${mdBtnClass} py-2.5 font-semibold`}>{t.sortLinesDesc}</button>
            <button type="button" onClick={() => updateText("", t.cleared)} className={`bg-rose-50 text-rose-700 py-2.5 rounded-lg font-semibold`}>{t.clearAll}</button>
          </div>
        </details>

        <details className={`group border rounded-2xl ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-xs uppercase text-slate-500">
            <div>⚡ {t.proTools}</div>
            <span className="transition group-open:rotate-180 text-slate-400">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.encodeBase64}</button>
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.decodeBase64}</button>
             <button className={`${mdBtnClass} py-2.5 font-semibold`}>{t.formatJSON}</button>
          </div>
        </details>

        <footer className={`pt-8 border-t text-center text-[10px] text-slate-500 ${isLight ? "border-slate-200" : "border-slate-800"}`}>TextFix Pro &copy; 2026</footer>
      </div>
      {toastMsg && <div role="status" className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl z-50 animate-bounce">{toastMsg}</div>}
    </main>
  );
}