"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar" | "fr";

export const translations = {
    en: {
        // Header
        greeting_morning: "Good morning",
        greeting_afternoon: "Good afternoon",
        greeting_evening: "Good evening",
        // Landing nav
        sign_in: "Sign in",
        get_started: "Get started free",
        // Landing hero
        hero_badge: "Study. Earn XP. Level Up. Repeat.",
        hero_title_1: "Study Smarter.",
        hero_title_2: "Level Up.",
        hero_desc: "The only productivity platform that makes studying addictive. Pomodoro sessions, AI quizzes, real-time leaderboards, and a friends system built for students.",
        hero_cta: "Start for free",
        hero_students: "students already leveling up",
        // Stats
        stat_pass: "Pass rate improvement",
        stat_daily: "Average daily study",
        stat_quizzes: "AI quizzes generated",
        stat_sessions: "Study sessions completed",
        // Features section
        features_label: "Everything you need",
        features_title: "Built for serious students",
        features_desc: "Every feature designed to keep you motivated, organized, and making progress.",
        feat_pomodoro_title: "Pomodoro Timer",
        feat_pomodoro_desc: "Focus in deep work sprints. Track every session and earn XP as you study.",
        feat_quiz_title: "AI Quiz Generator",
        feat_quiz_desc: "Upload any PDF and get an instant personalized quiz. Study smarter with AI.",
        feat_gamify_title: "Gamification",
        feat_gamify_desc: "Earn XP, level up, unlock badges, and maintain study streaks.",
        feat_social_title: "Social Study",
        feat_social_desc: "Add friends, compete on leaderboards, and hold each other accountable.",
        feat_tasks_title: "Smart Tasks",
        feat_tasks_desc: "Organize tasks by subject, priority, and deadline. Never miss a thing.",
        feat_calendar_title: "Study Calendar",
        feat_calendar_desc: "Plan sessions, track exams, and visualize your entire study schedule.",
        // CTA
        cta_streak: "Start your streak today",
        cta_title: "Ready to level up your studies?",
        cta_desc: "Join thousands of students who have transformed how they study. Free forever. No credit card required.",
        cta_button: "Create free account",
        cta_xp: "🎁 Get +100 XP just for signing up",
        // Footer
        footer_copy: "© 2025 Nahda.Edu. Built for students, by students.",
        footer_credit: "Designed & built by",
        footer_tagline: "a student, for students 🎓",
    },
    ar: {
        greeting_morning: "صباح الخير",
        greeting_afternoon: "مساء الخير",
        greeting_evening: "مساء الخير",
        sign_in: "تسجيل الدخول",
        get_started: "ابدأ مجاناً",
        hero_badge: "ادرس. اكسب XP. ارتقِ. كرر.",
        hero_title_1: "ادرس بذكاء.",
        hero_title_2: "ارتقِ بمستواك.",
        hero_desc: "المنصة الوحيدة للإنتاجية التي تجعل الدراسة مسلية. جلسات بومودورو، اختبارات بالذكاء الاصطناعي، متصدري النتائج المباشرة، ونظام الأصدقاء المصمم للطلاب.",
        hero_cta: "ابدأ مجاناً",
        hero_students: "طالب يرتقون بمستواهم الآن",
        stat_pass: "تحسن نسبة النجاح",
        stat_daily: "متوسط الدراسة اليومية",
        stat_quizzes: "اختبار بالذكاء الاصطناعي",
        stat_sessions: "جلسة دراسية مكتملة",
        features_label: "كل ما تحتاجه",
        features_title: "مصمم للطلاب الجادين",
        features_desc: "كل ميزة مصممة لإبقائك متحفزاً ومنظماً وتحقيق التقدم.",
        feat_pomodoro_title: "مؤقت بومودورو",
        feat_pomodoro_desc: "ركز في جلسات عمل مكثفة. تتبع كل جلسة واكسب XP أثناء دراستك.",
        feat_quiz_title: "منشئ الاختبارات بالذكاء الاصطناعي",
        feat_quiz_desc: "ارفع أي ملف PDF واحصل على اختبار شخصي فوري. ادرس بذكاء مع الذكاء الاصطناعي.",
        feat_gamify_title: "نظام المكافآت",
        feat_gamify_desc: "اكسب XP، ارتقِ بمستواك، افتح الشارات، وحافظ على سلاسل الدراسة.",
        feat_social_title: "الدراسة الاجتماعية",
        feat_social_desc: "أضف أصدقاء، تنافس على المتصدرين، وتحفزوا معاً.",
        feat_tasks_title: "المهام الذكية",
        feat_tasks_desc: "نظم المهام حسب المادة والأولوية والموعد النهائي. لا تفوّت شيئاً.",
        feat_calendar_title: "تقويم الدراسة",
        feat_calendar_desc: "خطط للجلسات، تتبع الامتحانات، وصوّر جدول دراستك بالكامل.",
        cta_streak: "ابدأ سلسلتك اليوم",
        cta_title: "مستعد للارتقاء بدراستك؟",
        cta_desc: "انضم إلى آلاف الطلاب الذين غيّروا طريقة دراستهم. مجاني للأبد. لا يلزم بطاقة ائتمان.",
        cta_button: "إنشاء حساب مجاني",
        cta_xp: "🎁 احصل على +100 XP عند التسجيل",
        footer_copy: "© 2025 Nahda.Edu. مبنية للطلاب، من طرف الطلاب.",
        footer_credit: "تصميم وبناء",
        footer_tagline: "طالب، للطلاب 🎓",
    },
    fr: {
        greeting_morning: "Bonjour",
        greeting_afternoon: "Bon après-midi",
        greeting_evening: "Bonsoir",
        sign_in: "Se connecter",
        get_started: "Commencer gratuitement",
        hero_badge: "Étudie. Gagne des XP. Monte en niveau. Répète.",
        hero_title_1: "Étudie plus intelligemment.",
        hero_title_2: "Monte en niveau.",
        hero_desc: "La seule plateforme de productivité qui rend l'étude addictive. Sessions Pomodoro, quiz IA, classements en temps réel et système d'amis conçu pour les étudiants.",
        hero_cta: "Commencer gratuitement",
        hero_students: "étudiants déjà en progression",
        stat_pass: "Amélioration du taux de réussite",
        stat_daily: "Étude quotidienne moyenne",
        stat_quizzes: "Quiz IA générés",
        stat_sessions: "Sessions d'étude complétées",
        features_label: "Tout ce dont vous avez besoin",
        features_title: "Conçu pour les étudiants sérieux",
        features_desc: "Chaque fonctionnalité conçue pour vous garder motivé, organisé et en progression.",
        feat_pomodoro_title: "Minuteur Pomodoro",
        feat_pomodoro_desc: "Concentrez-vous en sprints de travail intensif. Suivez chaque session et gagnez des XP.",
        feat_quiz_title: "Générateur de Quiz IA",
        feat_quiz_desc: "Téléchargez n'importe quel PDF et obtenez un quiz personnalisé instantané.",
        feat_gamify_title: "Gamification",
        feat_gamify_desc: "Gagnez des XP, montez de niveau, débloquez des badges et maintenez vos séries d'étude.",
        feat_social_title: "Étude sociale",
        feat_social_desc: "Ajoutez des amis, rivalisez dans les classements et responsabilisez-vous mutuellement.",
        feat_tasks_title: "Tâches intelligentes",
        feat_tasks_desc: "Organisez les tâches par matière, priorité et date limite. Ne ratez jamais rien.",
        feat_calendar_title: "Calendrier d'étude",
        feat_calendar_desc: "Planifiez des sessions, suivez les examens et visualisez votre programme d'étude.",
        cta_streak: "Commencez votre série aujourd'hui",
        cta_title: "Prêt à améliorer vos études ?",
        cta_desc: "Rejoignez des milliers d'étudiants qui ont transformé leur façon d'étudier. Gratuit pour toujours. Aucune carte de crédit requise.",
        cta_button: "Créer un compte gratuit",
        cta_xp: "🎁 Obtenez +100 XP rien que pour vous inscrire",
        footer_copy: "© 2025 Nahda.Edu. Construit pour les étudiants, par les étudiants.",
        footer_credit: "Conçu et développé par",
        footer_tagline: "un étudiant, pour les étudiants 🎓",
    },
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
    dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        const saved = localStorage.getItem("nahda-lang") as Language;
        if (saved && ["en", "ar", "fr"].includes(saved)) {
            setLanguageState(saved);
            document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
            document.documentElement.lang = saved;
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("nahda-lang", lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] ?? translations.en[key] ?? key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === "ar" ? "rtl" : "ltr" }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}