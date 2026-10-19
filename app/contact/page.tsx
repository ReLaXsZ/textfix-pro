"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const content = {
  bg: {
    title: "Контакти",
    desc: "Имате въпрос, предложение или проблем? Свържете се с нас!",
    back: "← Обратно към сайта",
    emailTitle: "📧 Имейл за връзка",
    emailDesc: "Изпратете ни съобщение на:",
    fbTitle: "🤝 Обратна връзка и идеи",
    fbDesc: "Ако имате идея за нова функция или откриете бъг, ще се радваме да ни пишете.",
    timeTitle: "⏱️ Време за отговор",
    timeDesc: "Обикновено отговаряме в рамките на 24–48 часа (в делнични дни)."
  },
  en: {
    title: "Contact",
    desc: "Have a question, suggestion or issue? Contact us!",
    back: "← Back to site",
    emailTitle: "📧 Email",
    emailDesc: "Send us a message at:",
    fbTitle: "🤝 Feedback and ideas",
    fbDesc: "If you have an idea for a new feature or found a bug, we'd love to hear from you.",
    timeTitle: "⏱️ Response time",
    timeDesc: "We usually respond within 24–48 hours (on business days)."
  },
  fr: {
    title: "Contact",
    desc: "Une question, une suggestion ou un problème ? Contactez-nous !",
    back: "← Retour au site",
    emailTitle: "📧 Email",
    emailDesc: "Envoyez-nous un message à :",
    fbTitle: "🤝 Commentaires et idées",
    fbDesc: "Si vous avez une idée ou avez trouvé un bug, écrivez-nous.",
    timeTitle: "⏱️ Temps de réponse",
    timeDesc: "Nous répondons généralement sous 24 à 48 heures."
  },
  de: {
    title: "Kontakt",
    desc: "Haben Sie eine Frage, einen Vorschlag oder ein Problem? Kontaktieren Sie uns!",
    back: "← Zurück zur Seite",
    emailTitle: "📧 E-Mail",
    emailDesc: "Senden Sie uns eine Nachricht an:",
    fbTitle: "🤝 Feedback und Ideen",
    fbDesc: "Wenn Sie eine Idee haben oder einen Fehler gefunden haben, schreiben Sie uns.",
    timeTitle: "⏱️ Antwortzeit",
    timeDesc: "Wir antworten normalerweise innerhalb von 24–48 Stunden."
  },
  es: {
    title: "Contacto",
    desc: "¿Tienes una pregunta, sugerencia o problema? ¡Contáctanos!",
    back: "← Volver al sitio",
    emailTitle: "📧 Correo electrónico",
    emailDesc: "Envíanos un mensaje a:",
    fbTitle: "🤝 Comentarios e ideas",
    fbDesc: "Si tienes una idea o encontraste un error, escríbenos.",
    timeTitle: "⏱️ Tiempo de respuesta",
    timeDesc: "Normalmente respondemos en 24–48 horas."
  },
  tr: {
    title: "İletişim",
    desc: "Bir sorunuz, öneriniz veya sorununuz mu var? Bize ulaşın!",
    back: "← Siteye dön",
    emailTitle: "📧 E-posta",
    emailDesc: "Bize şu adresten mesaj gönderin:",
    fbTitle: "🤝 Geri bildirim ve fikirler",
    fbDesc: "Yeni bir özellik fikriniz varsa veya bir hata bulduysanız, bize yazın.",
    timeTitle: "⏱️ Yanıt süresi",
    timeDesc: "Genellikle 24–48 saat içinde yanıt veririz."
  }
};

export default function Contact() {
  const [lang, setLang] = useState("bg");
  
  useEffect(() => {
    const storedLang = localStorage.getItem("textfix_lang");
    if (storedLang && ["bg", "en", "fr", "de", "es", "tr"].includes(storedLang)) {
      setLang(storedLang);
    }
  }, []);

  const t = (content as any)[lang] || content.en;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Link href="/" className="inline-block text-xs font-semibold text-blue-500 hover:underline mb-4">{t.back}</Link>
        <h1 className="text-3xl font-extrabold text-white">{t.title}</h1>
        <p className="text-sm text-slate-400">{t.desc}</p>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">{t.emailTitle}</h3>
            <p className="text-sm text-slate-400 mt-1">{t.emailDesc} <br/><strong className="text-blue-400">relaxsz91@gmail.com</strong></p>
          </div>
          
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">{t.fbTitle}</h3>
            <p className="text-sm text-slate-400 mt-1">{t.fbDesc}</p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">{t.timeTitle}</h3>
            <p className="text-sm text-slate-400 mt-1">{t.timeDesc}</p>
          </div>
        </div>
      </div>
    </main>
  );
}