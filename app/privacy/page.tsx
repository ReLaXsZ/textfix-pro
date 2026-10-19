"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const content = {
  bg: {
    title: "Политика за поверителност",
    updated: "Последна актуализация: Октомври 2026",
    back: "← Обратно към сайта",
    sections: [
      { h: "1. Въведение", p: "Добре дошли в TextFix Pro. Вашата поверителност е важна за нас. Тази политика обяснява какви лични данни събираме, как ги използваме и как ги защитаваме, когато използвате нашия уебсайт." },
      { h: "2. Какви данни събираме", p: "Текст, който въвеждате: Целият текст се обработва локално или през защитен API. Ние не съхраняваме вашия текст. Локална памет: Използваме localStorage за запазване на история и тема. Бисквитки: Използваме Google AdSense за реклами." },
      { h: "3. Изкуствен интелект (AI)", p: "Когато използвате AI функции, текстът се изпраща към Google Gemini API. Не въвеждайте високочувствителна информация." },
      { h: "4. Бисквитки и AdSense", p: "Google използва бисквитки за персонализирани реклами. Можете да се откажете от настройките за реклами на Google." },
      { h: "5. Вашите права", p: "Можете да изчистите данните си по всяко време чрез настройките на браузъра." },
      { h: "6. Контакт", p: "За въпроси: relaxsz91@gmail.com" }
    ]
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 2026",
    back: "← Back to site",
    sections: [
      { h: "1. Introduction", p: "Welcome to TextFix Pro. Your privacy is important to us. This policy explains what personal data we collect and how we protect it." },
      { h: "2. Data We Collect", p: "Text you enter: Processed locally or via secure API. We do not store your text. Local Storage: Used for history and theme. Cookies: Google AdSense for ads." },
      { h: "3. Artificial Intelligence (AI)", p: "When using AI features, text is sent to Google Gemini API. Do not enter highly sensitive information." },
      { h: "4. Cookies and AdSense", p: "Google uses cookies for personalized ads. You can opt out in Google Ads Settings." },
      { h: "5. Your Rights", p: "You can clear your data anytime via browser settings." },
      { h: "6. Contact", p: "For questions: relaxsz91@gmail.com" }
    ]
  },
  fr: {
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : Octobre 2026",
    back: "← Retour au site",
    sections: [
      { h: "1. Introduction", p: "Bienvenue sur TextFix Pro. Votre vie privée est importante. Cette politique explique quelles données nous collectons." },
      { h: "2. Données Collectées", p: "Texte saisi : Traité localement ou via API sécurisée. Stockage local : Historique et thème. Cookies : Google AdSense." },
      { h: "3. Intelligence Artificielle (IA)", p: "Les textes sont envoyés à l'API Google Gemini. N'entrez pas d'informations sensibles." },
      { h: "4. Cookies et AdSense", p: "Google utilise des cookies. Vous pouvez désactiver les annonces personnalisées." },
      { h: "5. Vos Droits", p: "Vous pouvez effacer vos données via les paramètres du navigateur." },
      { h: "6. Contact", p: "Pour questions : relaxsz91@gmail.com" }
    ]
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Letzte Aktualisierung: Oktober 2026",
    back: "← Zurück zur Seite",
    sections: [
      { h: "1. Einleitung", p: "Willkommen bei TextFix Pro. Ihre Privatsphäre ist uns wichtig. Diese Richtlinie erklärt, welche Daten wir sammeln." },
      { h: "2. Gesammelte Daten", p: "Eingegebener Text: Lokal oder über sichere API verarbeitet. Lokaler Speicher: Verlauf und Theme. Cookies: Google AdSense." },
      { h: "3. Künstliche Intelligenz (KI)", p: "Text wird an Google Gemini API gesendet. Geben Sie keine sensiblen Daten ein." },
      { h: "4. Cookies und AdSense", p: "Google verwendet Cookies für personalisierte Anzeigen. Sie können dies deaktivieren." },
      { h: "5. Ihre Rechte", p: "Sie können Ihre Daten über die Browsereinstellungen löschen." },
      { h: "6. Kontakt", p: "Für Fragen: relaxsz91@gmail.com" }
    ]
  },
  es: {
    title: "Política de Privacidad",
    updated: "Última actualización: Octubre 2026",
    back: "← Volver al sitio",
    sections: [
      { h: "1. Introducción", p: "Bienvenido a TextFix Pro. Tu privacidad es importante. Esta política explica qué datos recopilamos." },
      { h: "2. Datos Recopilados", p: "Texto ingresado: Procesado localmente o vía API segura. Almacenamiento local: Historial y tema. Cookies: Google AdSense." },
      { h: "3. Inteligencia Artificial (IA)", p: "El texto se envía a Google Gemini API. No introduzcas información sensible." },
      { h: "4. Cookies y AdSense", p: "Google usa cookies. Puedes desactivar los anuncios personalizados." },
      { h: "5. Tus Derechos", p: "Puedes borrar tus datos en la configuración del navegador." },
      { h: "6. Contacto", p: "Para preguntas: relaxsz91@gmail.com" }
    ]
  },
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: Ekim 2026",
    back: "← Siteye dön",
    sections: [
      { h: "1. Giriş", p: "TextFix Pro'ya hoş geldiniz. Gizliliğiniz bizim için önemlidir. Bu politika hangi verileri topladığımızı açıklar." },
      { h: "2. Toplanan Veriler", p: "Girilen Metin: Yerel veya güvenli API ile işlenir. Yerel Depolama: Geçmiş ve tema. Çerezler: Google AdSense." },
      { h: "3. Yapay Zeka (YZ)", p: "Metinler Google Gemini API'ye gönderilir. Hassas bilgi girmeyin." },
      { h: "4. Çerezler ve AdSense", p: "Google çerezleri kullanır. Kişiselleştirilmiş reklamları kapatabilirsiniz." },
      { h: "5. Haklarınız", p: "Verilerinizi tarayıcı ayarlarından silebilirsiniz." },
      { h: "6. İletişim", p: "Sorular için: relaxsz91@gmail.com" }
    ]
  }
};

export default function PrivacyPolicy() {
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
      <div className="w-full max-w-3xl space-y-6">
        <Link href="/" className="inline-block text-xs font-semibold text-blue-500 hover:underline mb-4">{t.back}</Link>
        <h1 className="text-3xl font-extrabold text-white">{t.title}</h1>
        <p className="text-xs text-slate-400">{t.updated}</p>
        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          {t.sections.map((sec: any, i: number) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-slate-100 mb-2">{sec.h}</h2>
              <p>{sec.p}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}