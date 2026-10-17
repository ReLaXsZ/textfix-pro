"use client";

import { useState } from "react";

export default function ShareButtons() {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://textfix-pro.vercel.app";
  const shareTitle = "TextFix Pro - Интелигентен текстов помощник & Редактор онлайн";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Грешка при копиране: ", err);
    }
  };

  const handleShare = (platform: string) => {
    let url = "";
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case "viber":
        url = `viber://forward?text=${encodedTitle}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=500,noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-slate-300">
      <div className="flex items-center gap-2 text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Харесва ви инструмента? Споделете го:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Facebook */}
        <button
          onClick={() => handleShare("facebook")}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all"
        >
          Facebook
        </button>

        {/* WhatsApp */}
        <button
          onClick={() => handleShare("whatsapp")}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all"
        >
          WhatsApp
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => handleShare("linkedin")}
          className="px-3 py-1.5 text-xs font-medium bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg transition-all"
        >
          LinkedIn
        </button>

        {/* X / Twitter */}
        <button
          onClick={() => handleShare("twitter")}
          className="px-3 py-1.5 text-xs font-medium bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600/30 rounded-lg transition-all"
        >
          X (Twitter)
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex items-center gap-1 shadow-sm"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Копирано!</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Копирай линк</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}