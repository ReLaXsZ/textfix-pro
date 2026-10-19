"use client";

import { useEffect, useState } from "react";

type Lang = "bg" | "en" | "fr" | "de";

const SHARE_URL = "https://textfix-pro.vercel.app";

const TEXTS: Record<Lang, { shareText: string; shareLabel: string; copied: string; copyLink: string; copyFailed: string }> = {
  bg: {
    shareText: "Вижте този страхотен интелигентен текстов редактор и помощник онлайн!",
    shareLabel: "Споделете сайта:",
    copied: "Копирано!",
    copyLink: "Копирай линк",
    copyFailed: "Грешка при копиране",
  },
  en: {
    shareText: "Check out this great intelligent text editor and assistant online!",
    shareLabel: "Share this site:",
    copied: "Copied!",
    copyLink: "Copy link",
    copyFailed: "Copy failed",
  },
  fr: {
    shareText: "Découvrez ce formidable éditeur et assistant textuel intelligent en ligne !",
    shareLabel: "Partagez ce site :",
    copied: "Copié !",
    copyLink: "Copier le lien",
    copyFailed: "Échec de la copie",
  },
  de: {
    shareText: "Entdecken Sie diesen großartigen intelligenten Texteditor und Assistenten online!",
    shareLabel: "Diese Seite teilen:",
    copied: "Kopiert!",
    copyLink: "Link kopieren",
    copyFailed: "Kopieren fehlgeschlagen",
  },
};

export default function ShareButtons({ lang = "bg", isLight = false }: { lang?: Lang; isLight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const t = TEXTS[lang];

  useEffect(() => {
    return () => {
      setCopied(false);
      setError(false);
    };
  }, []);

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "TextFix Pro",
          text: t.shareText,
          url: SHARE_URL,
        });
      } catch (err) {
        console.log("Share cancelled:", err);
      }
    } else {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(SHARE_URL);
    const encodedTitle = encodeURIComponent(`TextFix Pro - ${t.shareText}`);
    let url = "";

    switch (platform) {
      case "facebook": url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; break;
      case "twitter": url = `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`; break;
      case "linkedin": url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`; break;
      case "whatsapp": url = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`; break;
      case "telegram": url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`; break;
      case "reddit": url = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`; break;
      default: return;
    }

    const win = window.open(url, "_blank", "width=600,height=500,noopener,noreferrer");
    if (!win) window.location.href = url;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto my-6 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border transition-colors duration-300 ${
      isLight 
        ? "bg-slate-50 border-slate-200 text-slate-700 shadow-sm" 
        : "bg-slate-900/50 border-slate-800 text-slate-300 backdrop-blur-sm shadow-md"
    }`}>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label={t.shareLabel}
        className={`flex items-center gap-2 text-sm font-semibold transition-colors group cursor-pointer ${
          isLight ? "text-slate-800 hover:text-indigo-600" : "text-slate-200 hover:text-indigo-400"
        }`}
        title={t.shareLabel}
      >
        <span className={`p-2 rounded-lg border transition-all ${
          isLight ? "bg-indigo-100 border-indigo-200" : "bg-indigo-600/20 border-indigo-500/30"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLight ? "text-indigo-600" : "text-indigo-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </span>
        <span>{t.shareLabel}</span>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => handleShare("facebook")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30"}`}>Facebook</button>
        <button type="button" onClick={() => handleShare("whatsapp")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30"}`}>WhatsApp</button>
        <button type="button" onClick={() => handleShare("telegram")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-sky-50 text-sky-600 border-sky-200" : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-400/30"}`}>Telegram</button>
        <button type="button" onClick={() => handleShare("reddit")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-orange-50 text-orange-600 border-orange-200" : "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border-orange-500/30"}`}>Reddit</button>
        <button type="button" onClick={() => handleShare("linkedin")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-sky-50 text-sky-700 border-sky-200" : "bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border-sky-500/30"}`}>LinkedIn</button>
        <button type="button" onClick={() => handleShare("twitter")} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isLight ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300" : "bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border-slate-600/30"}`}>X (Twitter)</button>
        
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t.copyLink}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 shadow-sm ${
            error ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{t.copied}</span>
            </>
          ) : error ? (
            <span>{t.copyFailed}</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>{t.copyLink}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}