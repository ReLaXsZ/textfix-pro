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

// НОВ КОМПОНЕНТ: Бутон за AI с описание под него
function AiButton({ onClick, text, desc, isAi = true, isLoading = false, isLight, processingText }: any) {
  return (
    <button type="button" onClick={onClick} disabled={isLoading} className={`w-full py-2 px-2 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-70 ${isAi ? (isLight ? "bg-blue-600 text-white border-blue-600" : "bg-blue-600 text-white border-blue-500") : ""}`}>
      {isLoading ? (
        <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />{processingText}</span>
      ) : (
        <>
          <span>{text}</span>
          <span className="text-[9px] font-normal opacity-70">{desc}</span>
        </>
      )}
    </button>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>("bg");
  const [isLight, setIsLight] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [text, setText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
  const [customPrompt, setCustomPrompt] = useState("");

  const [genTopic, setGenTopic] = useState("");
  const [genTone, setGenTone] = useState("formal");
  const [compareText2, setCompareText2] = useState("");
  const [smartTransLang, setSmartTransLang] = useState("English");

  const [password, setPassword] = useState("");
  const [passOptions, setPassOptions] = useState({ length: 16, upper: true, lower: true, num: true, sym: true });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imgBgColor, setImgBgColor] = useState("#1e293b");
  const [imgTextColor, setImgTextColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState<"pass" | "img" | "ocr" | "social">("pass");

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const recognitionRestartCountRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const imageRenderRef = useRef<HTMLDivElement>(null);

  const t: any = translations[lang] || translations.en;

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem("textfix_theme");
      if (storedTheme === "light" || storedTheme === "dark") setIsLight(storedTheme === "light");
      else { const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; setIsLight(!prefersDark); }
      
      const storedLang = localStorage.getItem("textfix_lang") as Language;
      if (storedLang && ["bg", "en", "fr", "de", "es", "tr"].includes(storedLang)) {
        setLang(storedLang);
      } else {
        const bl = navigator.language.toLowerCase();
        if (bl.startsWith("bg")) setLang("bg");
        else if (bl.startsWith("fr")) setLang("fr");
        else if (bl.startsWith("de")) setLang("de");
        else if (bl.startsWith("es")) setLang("es");
        else if (bl.startsWith("tr")) setLang("tr");
        else setLang("en");
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try { localStorage.setItem("textfix_theme", isLight ? "light" : "dark"); } catch (e) { console.error(e); }
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", !isLight);
  }, [isLight, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    try { localStorage.setItem("textfix_lang", lang); } catch (e) { console.error(e); }
  }, [lang, isMounted]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      commitHistory(newText);
    }, HISTORY_DEBOUNCE_MS);
  };

  const updateText = useCallback((newText: string, msg?: string) => {
    if (newText === text) return;
    setText(newText); 
    if (msg) showToast(msg);
    commitHistory(newText);
  }, [text, showToast, commitHistory]);

  const undo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setText(history[historyIndex - 1]); showToast(t.undo); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setText(history[historyIndex + 1]); showToast(t.redo); } };

  const charCount = text.length;
  const wordCount = useMemo(() => (text.trim() === "" ? 0 : text.trim().split(/\s+/).length), [text]);
  const lineCount = useMemo(() => (text.trim() === "" ? 0 : text.split(/\r\n|\r|\n/).length), [text]);
  const readTime = Math.ceil(wordCount / 200);
  const sentenceCount = useMemo(() => {
    if (text.trim() === "") return 0;
    return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
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

  const copyText = async () => {
    if (!text.trim()) return showToast(t.noTextToCopy);
    try { await navigator.clipboard.writeText(text); showToast(t.copied); } catch { }
  };

  const downloadTxt = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "TextFix.txt"); showToast(t.downloaded);
  };

  const downloadDocx = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const paragraphs = text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }));
    const doc = new Document({ sections: [{ children: paragraphs }] });
    Packer.toBlob(doc).then((blob) => { saveAs(blob, "TextFix.docx"); showToast(t.downloaded); });
  };

  const downloadPdf = () => {
    if (!text.trim()) return showToast(t.noTextToDownload);
    const doc = new jsPDF(); const splitText = doc.splitTextToSize(text, 180); doc.text(splitText, 15, 15); doc.save("TextFix.pdf"); showToast(t.downloaded);
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return showToast("Браузърът ви не поддържа микрофон. Опитайте с Chrome.");
    
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
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) transcript += event.results[i][0].transcript + " ";
        if (transcript) setText((prev) => prev ? prev + " " + transcript.trim() : transcript.trim());
      };
      recognition.onerror = (e: any) => { 
        if (e.error === "not-allowed") { showToast("Моля, разрешете достъп до микрофона."); }
        else { showToast("Грешка: " + e.error); }
        isListeningRef.current = false; setIsListening(false); 
      };
      recognition.onend = () => {
        if (isListeningRef.current && recognitionRestartCountRef.current < 5) { recognitionRestartCountRef.current++; try { recognition.start(); } catch { setIsListening(false); } }
        else { setIsListening(false); isListeningRef.current = false; }
      };
      recognition.start();
    } catch { showToast(t.listeningError); isListeningRef.current = false; setIsListening(false); }
  };

  const toggleSpeech = () => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return showToast("Браузърът ви не поддържа TTS (четене на глас).");
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return showToast(t.speakingStopped); }
    if (!text.trim()) return showToast(t.noTextToSpeak);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "bg" ? "bg-BG" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-US";
    utterance.rate = ttsRate; utterance.pitch = ttsPitch;
    utterance.onend = () => setIsSpeaking(false); utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true); window.speechSynthesis.speak(utterance); showToast(t.speaking);
  };

  const handleAiAction = async (actionType: string, customInst: string = "") => {
    if (!text.trim() && actionType !== "generate") return showToast(t.noTextForAi);
    setLoadingAction(actionType); showToast(t.processing);
    try {
      const response = await fetch("/api/ai", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ text, action: actionType, customInstruction: customInst }) 
      });
      
      if (!response.ok) { 
        return showToast(t.aiError); 
      }
      
      const data = await response.json();
      if (data?.result) { 
        updateText(data.result, t.resultReady); 
      } else {
        showToast(t.aiError);
      }
    } catch { 
      showToast(t.aiConnectionError); 
    } finally { 
      setLoadingAction(null); 
    }
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
      if (translated) { updateText(translated, t.translationReady); }
      else showToast(t.translateNoResult);
    } catch { showToast(t.translateError); }
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

  const encodeBase64 = () => { try { const b = new TextEncoder().encode(text); let bin = ""; b.forEach((x) => (bin += String.fromCharCode(x))); updateText(btoa(bin), t.encodeSuccess); } catch { showToast(t.encodeError); } };
  const decodeBase64 = () => { try { const bin = atob(text); const b = Uint8Array.from(bin, (c) => c.charCodeAt(0)); updateText(new TextDecoder().decode(b), t.decodeSuccess); } catch { showToast(t.invalidBase64); } };
  const formatJSON = () => { try { updateText(JSON.stringify(JSON.parse(text), null, 2), t.jsonFormatted); } catch { showToast(t.invalidJson); } };

  const charCounterColor = charCount > 5000 ? "text-rose-500 font-bold" : "text-blue-600";
  const mdBtnClass = `px-2.5 py-1 rounded border transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"}`;

  if (!isMounted) return null;

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
          <div className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg font-bold text-blue-600">{sentenceCount}</div><div className="text-[10px] text-slate-500 uppercase mt-0.5">{t.sentences || "Sentences"}</div></div>
          <button type="button" onClick={async () => { try { const t = await navigator.clipboard.readText(); updateText(t, "OK!"); } catch { } }} className={`p-3 rounded-xl border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}><div className="text-lg">{t.pasteBtn}</div></button>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="space-x-2 flex items-center">
              <button type="button" onClick={toggleVoiceInput} className={`px-3 py-1.5 rounded-md font-semibold border flex items-center gap-1.5 ${isListening ? "bg-rose-600 text-white border-rose-600 animate-pulse" : isLight ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 text-slate-200 border-slate-700"}`}>{isListening ? t.voiceStop : t.voiceInput}</button>
              <button type="button" onClick={toggleSpeech} className={`px-3 py-1.5 rounded-md font-semibold border flex items-center gap-1.5 ${isSpeaking ? "bg-amber-600 text-white border-amber-600 animate-pulse" : isLight ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-800 text-slate-200 border-slate-700"}`}>{isSpeaking ? t.speakStop : t.speakText}</button>
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
          <textarea 
            value={text} 
            onChange={handleTextChange} 
            placeholder={t.placeholder} 
            spellCheck={false}
            className={`w-full h-48 p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 text-sm resize-y ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`} 
          />
        ) : (
          <div className={`w-full h-48 p-4 rounded-xl border overflow-y-auto text-sm whitespace-pre-wrap ${isLight ? "bg-white border-slate-300" : "bg-slate-900 border-slate-800"}`}>{text || t.noTextPreview}</div>
        )}

        <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? "bg-blue-50/40 border-blue-100" : "bg-slate-900/50 border-slate-800"}`}>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{t.aiTools}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <AiButton onClick={() => handleAiAction("summary")} text={t.aiSummary} desc={t.desc_aiSummary} isLoading={loadingAction === "summary"} isLight={isLight} processingText={t.processing} />
            <AiButton onClick={() => handleAiAction("fix")} text={t.aiFix} desc={t.desc_aiFix} isLoading={loadingAction === "fix"} isLight={isLight} processingText={t.processing} />
            <AiButton onClick={() => handleAiAction("expand")} text={t.aiExpand} desc={t.desc_aiExpand} isLoading={loadingAction === "expand"} isLight={isLight} processingText={t.processing} />
            
            <AiButton onClick={() => handleAiAction("fix_explain")} text={t.aiFixExplain} desc={t.desc_aiFixExplain} isLoading={loadingAction === "fix_explain"} isLight={isLight} processingText={t.processing} />
            <AiButton onClick={() => handleAiAction("detect_fix")} text={t.aiDetectFix} desc={t.desc_aiDetectFix} isLoading={loadingAction === "detect_fix"} isLight={isLight} processingText={t.processing} />
            <AiButton onClick={() => handleAiAction("meta_desc")} text={t.aiMetaDesc} desc={t.desc_aiMetaDesc} isLoading={loadingAction === "meta_desc"} isLight={isLight} processingText={t.processing} />
            <AiButton onClick={() => handleAiAction("reading_level")} text={t.aiReadingLevel} desc={t.desc_aiReadingLevel} isLoading={loadingAction === "reading_level"} isLight={isLight} processingText={t.processing} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200/50 dark:border-slate-700/50">
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase">{t.aiGenerate}</div>
              <input type="text" placeholder={t.genTopic} value={genTopic} onChange={(e) => setGenTopic(e.target.value)} spellCheck={false} className={`w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-blue-500 ${isLight ? "bg-white border-slate-300" : "bg-slate-950 border-slate-800"}`} />
              <select value={genTone} onChange={(e) => setGenTone(e.target.value)} className={`w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-blue-500 ${isLight ? "bg-white border-slate-300" : "bg-slate-950 border-slate-800"}`}>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="funny">Funny</option>
              </select>
              <button type="button" onClick={() => handleAiAction("generate", genTopic + "|" + genTone)} disabled={!genTopic || loadingAction === "generate"} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50">
                {loadingAction === "generate" ? t.processing : t.genBtn}
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase">{t.aiSmartTrans}</div>
              <select value={smartTransLang} onChange={(e) => setSmartTransLang(e.target.value)} className={`w-full border px-3 py-2 text-xs rounded-lg outline-none focus:border-blue-500 ${isLight ? "bg-white border-slate-300" : "bg-slate-950 border-slate-800"}`}>
                <option value="English">English</option>
                <option value="Bulgarian">Bulgarian</option>
                <option value="German">German</option>
                <option value="French">French</option>
              </select>
              <button type="button" onClick={() => handleAiAction("translate_smart", smartTransLang)} disabled={loadingAction === "translate_smart"} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50">
                {loadingAction === "translate_smart" ? t.processing : t.aiSmartTrans}
              </button>
            </div>
          </div>
        </div>

        {showCompare && (
          <div className={`p-4 rounded-xl border space-y-3 ${isLight ? "bg-amber-50/50 border-amber-200" : "bg-slate-900/60 border-slate-800"}`}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.compareAiBtn}</div>
            <textarea value={compareText2} onChange={(e) => setCompareText2(e.target.value)} placeholder={t.comparePlaceholder2} spellCheck={false} className={`w-full h-32 p-3 text-xs font-mono rounded-lg border focus:outline-none focus:border-amber-500 ${isLight ? "bg-white border-slate-300" : "bg-slate-950 border-slate-800"}`} />
            <button type="button" onClick={() => handleAiAction("compare", compareText2)} disabled={!compareText2 || loadingAction === "compare"} className="w-full bg-amber-600 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50">
              {loadingAction === "compare" ? t.processing : t.compareAiBtn}
            </button>
          </div>
        )}

        {/* TOOLKIT SECTION С ОПИСАНИЯ */}
        <div className={`rounded-2xl border overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
          <div className={`p-4 border-b ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}><h3 className="font-bold text-sm">{t.toolkitTitle}</h3></div>
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button 
              onClick={() => setActiveTab("pass")} 
              className={`flex-1 py-3 px-2 text-center border-b-2 flex flex-col items-center justify-center gap-1 ${activeTab === "pass" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              <span>{t.toolPass}</span>
              <span className="text-[9px] font-normal opacity-70 hidden sm:block">{t.desc_pass}</span>
            </button>
            <button 
              onClick={() => setActiveTab("img")} 
              className={`flex-1 py-3 px-2 text-center border-b-2 flex flex-col items-center justify-center gap-1 ${activeTab === "img" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              <span>{t.toolImg}</span>
              <span className="text-[9px] font-normal opacity-70 hidden sm:block">{t.desc_img}</span>
            </button>
            <button 
              onClick={() => setActiveTab("ocr")} 
              className={`flex-1 py-3 px-2 text-center border-b-2 flex flex-col items-center justify-center gap-1 ${activeTab === "ocr" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              <span>{t.toolOcr}</span>
              <span className="text-[9px] font-normal opacity-70 hidden sm:block">{t.desc_ocr}</span>
            </button>
            <button 
              onClick={() => setActiveTab("social")} 
              className={`flex-1 py-3 px-2 text-center border-b-2 flex flex-col items-center justify-center gap-1 ${activeTab === "social" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              <span>{t.toolSocial}</span>
              <span className="text-[9px] font-normal opacity-70 hidden sm:block">{t.desc_social}</span>
            </button>
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

        <div className={`p-4 rounded-xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.searchReplace}</div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder={t.findPlaceholder} value={findVal} onChange={(e) => setFindVal(e.target.value)} spellCheck={false} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"}`} />
            <input type="text" placeholder={t.replacePlaceholder} value={replaceVal} onChange={(e) => setReplaceVal(e.target.value)} spellCheck={false} className={`border px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-blue-500 ${isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-slate-950 border-slate-800 text-slate-100"}`} />
            <button type="button" onClick={handleReplace} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">{t.replaceBtn}</button>
          </div>
        </div>

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

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.translit}</div>
          <div className="grid grid-cols-2 gap-2">
            <TooltipButton onClick={toLatin} text={t.cyrToLat} tip={t.tips.toLatin} isLight={isLight} processingText={t.processing} />
            <TooltipButton onClick={toCyrillic} text={t.latToCyr} tip={t.tips.toCyrillic} isLight={isLight} processingText={t.processing} />
          </div>
        </div>

        <footer className={`pt-8 border-t text-center text-[10px] text-slate-500 ${isLight ? "border-slate-200" : "border-slate-800"}`}>TextFix Pro &copy; 2026</footer>
      </div>
      {toastMsg && <div role="status" className="fixed bottom-6 right-6 bg-emerald-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-2xl z-50 animate-bounce">{toastMsg}</div>}
    </main>
  );
}