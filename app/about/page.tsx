"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const content = {
  bg: {
    title: "За TextFix Pro",
    back: "← Обратно към сайта",
    p1: "TextFix Pro е безплатен онлайн инструмент, създаден с мисията да улесни работата с текст за всеки – от студенти и блогъри до професионалисти и преводачи.",
    p2: "В забързаното ежедневие често се сблъскваме с нуждата бързо да проверим граматиката си, да съкратим дълъг текст, да преведем документ или просто да преброим думите. TextFix Pro събира всички тези инструменти на едно място, без да изисква регистрация, безплатно и без досадни ограничения.",
    hFeatures: "Какво предлагаме?",
    f1: "AI Инструменти: Резюмета, граматика и разширяване на текст чрез Google Gemini.",
    f2: "Транслитерация и Превод: Бърз превод и преобразуване на кирилица в латиница.",
    f3: "Почистване на текст: Премахване на излишни интервали, дубликати и HTML тагове.",
    f4: "Експорт: Запазване на текст като .txt, .docx или .pdf.",
    f5: "Допълнителни инструменти: Генератор на пароли, OCR от снимка и проверка на лимити.",
    hPhil: "Нашата философия",
    p3: "Вярваме, че добрите инструменти трябва да бъдат достъпни за всеки. Затова TextFix Pro работи изцяло в браузъра ви, а вашите текстове се обработват сигурно. Ние не съхраняваме вашите данни и не изискваме имейл.",
    p4: "Сайтът се поддържа от реклами (Google AdSense), което ни позволява да продължаваме да го развиваме безплатно за вас."
  },
  en: {
    title: "About TextFix Pro",
    back: "← Back to site",
    p1: "TextFix Pro is a free online tool created with the mission to make working with text easier for everyone – from students and bloggers to professionals and translators.",
    p2: "In our busy daily lives, we often need to quickly check our grammar, shorten a long text, translate a document, or simply count words. TextFix Pro brings all these tools together in one place, requiring no registration, completely free, and without annoying limits.",
    hFeatures: "What we offer?",
    f1: "AI Tools: Summaries, grammar fixes, and text expansion via Google Gemini.",
    f2: "Transliteration & Translation: Fast translation and Cyrillic to Latin conversion.",
    f3: "Text Cleaning: Remove extra spaces, duplicates, and HTML tags.",
    f4: "Export: Save text as .txt, .docx, or .pdf.",
    f5: "Extra tools: Password generator, OCR from image, and social limit checks.",
    hPhil: "Our philosophy",
    p3: "We believe good tools should be accessible to everyone. That's why TextFix Pro works entirely in your browser and your texts are processed securely. We do not store your data and do not require an email.",
    p4: "The site is supported by ads (Google AdSense), which allows us to keep developing it for free."
  },
  fr: {
    title: "À propos de TextFix Pro",
    back: "← Retour au site",
    p1: "TextFix Pro est un outil en ligne gratuit créé dans le but de faciliter le travail avec le texte pour tous.",
    p2: "Nous avons souvent besoin de vérifier notre grammaire, raccourcir un texte ou compter des mots. TextFix Pro regroupe tous ces outils au même endroit, sans inscription.",
    hFeatures: "Ce que nous offrons ?",
    f1: "Outils IA : Résumés, grammaire et expansion via Google Gemini.",
    f2: "Translittération et Traduction : Rapide et facile.",
    f3: "Nettoyage de texte : Supprime les espaces, doublons et balises HTML.",
    f4: "Export : Sauvegardez en .txt, .docx ou .pdf.",
    f5: "Outils supplémentaires : Générateur de mots de passe, OCR.",
    hPhil: "Notre philosophie",
    p3: "Nous croyons que les bons outils doivent être accessibles à tous. TextFix Pro fonctionne dans votre navigateur et vos textes sont traités en toute sécurité.",
    p4: "Le site est soutenu par des publicités (Google AdSense)."
  },
  de: {
    title: "Über TextFix Pro",
    back: "← Zurück zur Seite",
    p1: "TextFix Pro ist ein kostenloses Online-Tool, das die Arbeit mit Text für jeden erleichtern soll.",
    p2: "Wir müssen oft schnell unsere Grammatik prüfen, einen Text kürzen oder Wörter zählen. TextFix Pro vereint all diese Tools an einem Ort, ohne Registrierung.",
    hFeatures: "Was wir bieten?",
    f1: "KI-Tools: Zusammenfassungen, Grammatik und Texterweiterung über Google Gemini.",
    f2: "Transliteration & Übersetzung: Schnell und einfach.",
    f3: "Textbereinigung: Entfernt Leerzeichen, Duplikate und HTML-Tags.",
    f4: "Export: Speichern als .txt, .docx oder .pdf.",
    f5: "Zusätzliche Tools: Passwort-Generator, OCR.",
    hPhil: "Unsere Philosophie",
    p3: "Wir glauben, dass gute Tools für jeden zugänglich sein sollten. TextFix Pro läuft in Ihrem Browser und Ihre Texte werden sicher verarbeitet.",
    p4: "Die Website wird durch Werbung (Google AdSense) unterstützt."
  },
  es: {
    title: "Acerca de TextFix Pro",
    back: "← Volver al sitio",
    p1: "TextFix Pro es una herramienta en línea gratuita creada para facilitar el trabajo con texto para todos.",
    p2: "A menudo necesitamos verificar nuestra gramática, acortar un texto o contar palabras. TextFix Pro reúne todas estas herramientas en un solo lugar, sin registro.",
    hFeatures: "¿Qué ofrecemos?",
    f1: "Herramientas de IA: Resúmenes, gramática y expansión vía Google Gemini.",
    f2: "Transliteración y Traducción: Rápido y fácil.",
    f3: "Limpieza de texto: Elimina espacios, duplicados y etiquetas HTML.",
    f4: "Exportar: Guarda en .txt, .docx o .pdf.",
    f5: "Herramientas extra: Generador de contraseñas, OCR.",
    hPhil: "Nuestra filosofía",
    p3: "Creemos que las buenas herramientas deben ser accesibles para todos. TextFix Pro funciona en tu navegador y tus textos se procesan de forma segura.",
    p4: "El sitio se mantiene con anuncios (Google AdSense)."
  },
  tr: {
    title: "TextFix Pro Hakkında",
    back: "← Siteye dön",
    p1: "TextFix Pro, herkes için metinle çalışmayı kolaylaştırmak amacıyla oluşturulmuş ücretsiz bir çevrimiçi araçtır.",
    p2: "Sık sık dilbilgimizi kontrol etmemiz, uzun bir metni kısaltmamız veya kelimeleri saymamız gerekir. TextFix Pro tüm bu araçları tek bir yerde toplar, kayıt gerektirmez.",
    hFeatures: "Neler sunuyoruz?",
    f1: "YZ Araçları: Özetler, dilbilgisi ve metin genişletme (Google Gemini).",
    f2: "Harf Çevirisi ve Çeviri: Hızlı ve kolay.",
    f3: "Metin Temizleme: Boşlukları, kopyaları ve HTML etiketlerini kaldırır.",
    f4: "Dışa Aktar: .txt, .docx veya .pdf olarak kaydedin.",
    f5: "Ek araçlar: Şifre oluşturucu, OCR.",
    hPhil: "Felsefemiz",
    p3: "İyi araçların herkes için erişilebilir olması gerektiğine inanıyoruz. TextFix Pro tarayıcınızda çalışır ve metinleriniz güvenli bir şekilde işlenir.",
    p4: "Site reklamlarla (Google AdSense) desteklenmektedir."
  }
};

export default function About() {
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
      <div className="w-full max-w-3xl space-y-8">
        <Link href="/" className="inline-block text-xs font-semibold text-blue-500 hover:underline mb-4">{t.back}</Link>
        <h1 className="text-3xl font-extrabold text-white">{t.title}</h1>

        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          <p>{t.p1}</p>
          <p>{t.p2}</p>
          <h2 className="text-lg font-bold text-slate-100 pt-4">{t.hFeatures}</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>{t.f1}</li>
            <li>{t.f2}</li>
            <li>{t.f3}</li>
            <li>{t.f4}</li>
            <li>{t.f5}</li>
          </ul>
          <h2 className="text-lg font-bold text-slate-100 pt-4">{t.hPhil}</h2>
          <p>{t.p3}</p>
          <p>{t.p4}</p>
        </div>
      </div>
    </main>
  );
}