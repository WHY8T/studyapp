"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Language } from "@/components/providers/LanguageContext";
import {
    Upload, Sparkles, Trophy, Calculator, Languages, Smartphone, Check, ChevronDown, CheckCircle2,
} from "lucide-react";

const en = {
    nav: { features: "Features", how: "How it works", pricing: "Pricing", faq: "FAQ" },
    how: {
        label: "How it works",
        title: "From PDF to practice in three steps",
        steps: [
            { title: "Upload your course PDF", desc: "Drop in a lecture, chapter or summary, up to 10 MB." },
            { title: "Get an AI quiz", desc: "Choose the difficulty and number of questions. Your quiz is ready in about 20 seconds, with hints and explanations." },
            { title: "Earn XP, keep your streak", desc: "Quizzes, focus sessions and finished tasks all earn XP. Climb the leaderboard with your friends." },
        ],
    },
    quiz: {
        label: "AI quiz generator",
        title: "Turn any chapter into a practice test",
        desc: "Upload a PDF and get multiple-choice questions with hints and a clear explanation after every answer, so you learn from mistakes instead of just counting them.",
        points: ["Easy, medium, hard or mixed difficulty", "A hint before you answer", "An explanation after you answer"],
        progress: "Question 3 of 10",
        level: "Medium",
        q: "Which organelle produces most of a cell's ATP?",
        opts: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"],
        ok: "Correct",
        why: "Mitochondria produce ATP through cellular respiration.",
    },
    algeria: {
        label: "Made for students in Algeria",
        title: "Tools that fit how you actually study",
        items: [
            { title: "Grade calculator", desc: "Average calculator with Grandes Écoles and general university modes, coefficients included." },
            { title: "Arabic, French and English", desc: "Switch language at any time. Arabic layouts read right to left." },
            { title: "Works on your phone", desc: "Install it from your browser, or download the Android app." },
        ],
        mockTitle: "Average",
        rows: [["Mathematics", "×4", "14.50"], ["Physics", "×3", "12.00"]],
        avg: "Average",
        avgValue: "13.43",
    },
    pricing: {
        label: "Pricing",
        title: "Start free, upgrade when you need more",
        free: { name: "Free", price: "0 DZD", note: "Forever", items: ["7 AI quizzes per month", "Pomodoro timer, tasks and calendar", "XP, streaks and leaderboard", "Grade calculator"], cta: "Create free account" },
        pro: { name: "Pro", price: "500 DZD", note: "per month", items: ["Unlimited AI quizzes", "Everything in Free", "Pay with EDAHABIA or CIB"], cta: "Get started" },
        footnote: "You can upgrade to Pro at any time from inside the app.",
    },
    faq: {
        label: "FAQ",
        title: "Questions? Answers.",
        items: [
            ["Is Nahda.Edu free?", "Yes. The free plan includes every tool with 7 AI quizzes per month. Pro, at 500 DZD per month, removes the quiz limit."],
            ["Can I use my own PDFs?", "Yes. Upload a PDF up to 10 MB and the quiz is generated from its text."],
            ["Which languages are available?", "Arabic, French and English. You can switch at any time."],
            ["Does it work on my phone?", "Yes. Install it from your browser or download the Android app."],
            ["How do I pay for Pro?", "With an EDAHABIA or CIB card, through Chargily."],
            ["How do I earn XP?", "You earn XP from focus sessions, finished tasks, quizzes and your daily streak. XP raises your level and your leaderboard rank."],
            ["Can I compete with my friends?", "Yes. Add your friends and compare progress on the leaderboard."],
        ],
    },
    footer: { product: "Product", account: "Account", follow: "Follow us", signin: "Sign in", register: "Create account" },
};
type Copy = typeof en;

const ar: Copy = {
    nav: { features: "المزايا", how: "كيف يعمل", pricing: "الأسعار", faq: "الأسئلة الشائعة" },
    how: {
        label: "كيف يعمل",
        title: "من ملف PDF إلى التدريب في ثلاث خطوات",
        steps: [
            { title: "ارفع ملف PDF لمقررك", desc: "أضف محاضرة أو فصلاً أو ملخصاً، حتى 10 ميغابايت." },
            { title: "احصل على اختبار بالذكاء الاصطناعي", desc: "اختر مستوى الصعوبة وعدد الأسئلة. يكون اختبارك جاهزاً خلال نحو 20 ثانية، مع تلميحات وشروحات." },
            { title: "اكسب XP وحافظ على سلسلتك", desc: "الاختبارات وجلسات التركيز والمهام المنجزة تمنحك XP. تصدّر قائمة المتصدرين مع أصدقائك." },
        ],
    },
    quiz: {
        label: "منشئ الاختبارات بالذكاء الاصطناعي",
        title: "حوّل أي فصل إلى اختبار تدريبي",
        desc: "ارفع ملف PDF واحصل على أسئلة اختيار من متعدد مع تلميحات وشرح واضح بعد كل إجابة، لتتعلم من أخطائك بدل أن تعدّها فقط.",
        points: ["مستوى سهل أو متوسط أو صعب أو مختلط", "تلميح قبل أن تجيب", "شرح بعد أن تجيب"],
        progress: "السؤال 3 من 10",
        level: "متوسط",
        q: "أي عُضيّة تنتج معظم ATP في الخلية؟",
        opts: ["النواة", "الميتوكوندريا", "الريبوسوم", "جهاز غولجي"],
        ok: "صحيح",
        why: "تنتج الميتوكوندريا ATP عبر التنفس الخلوي.",
    },
    algeria: {
        label: "مصمم لطلاب الجزائر",
        title: "أدوات تناسب طريقة دراستك الفعلية",
        items: [
            { title: "حاسبة المعدل", desc: "حاسبة معدل بنمطين: المدارس العليا والجامعة العامة، مع المعاملات." },
            { title: "العربية والفرنسية والإنجليزية", desc: "بدّل اللغة في أي وقت. وتُعرض الواجهة العربية من اليمين إلى اليسار." },
            { title: "يعمل على هاتفك", desc: "ثبّته من المتصفح أو حمّل تطبيق أندرويد." },
        ],
        mockTitle: "المعدل",
        rows: [["الرياضيات", "×4", "14.50"], ["الفيزياء", "×3", "12.00"]],
        avg: "المعدل",
        avgValue: "13.43",
    },
    pricing: {
        label: "الأسعار",
        title: "ابدأ مجاناً وارتقِ عندما تحتاج المزيد",
        free: { name: "مجاني", price: "0 دج", note: "للأبد", items: ["7 اختبارات بالذكاء الاصطناعي شهرياً", "مؤقت بومودورو والمهام والتقويم", "XP والسلاسل وقائمة المتصدرين", "حاسبة المعدل"], cta: "إنشاء حساب مجاني" },
        pro: { name: "Pro", price: "500 دج", note: "شهرياً", items: ["اختبارات غير محدودة بالذكاء الاصطناعي", "كل ما في الخطة المجانية", "الدفع عبر الذهبية أو CIB"], cta: "ابدأ الآن" },
        footnote: "يمكنك الترقية إلى Pro في أي وقت من داخل التطبيق.",
    },
    faq: {
        label: "الأسئلة الشائعة",
        title: "أسئلة وأجوبة",
        items: [
            ["هل Nahda.Edu مجاني؟", "نعم. الخطة المجانية تتضمن كل الأدوات مع 7 اختبارات بالذكاء الاصطناعي شهرياً. وخطة Pro بسعر 500 دج شهرياً تلغي حد الاختبارات."],
            ["هل أستطيع استخدام ملفات PDF الخاصة بي؟", "نعم. ارفع ملف PDF حتى 10 ميغابايت وسيُنشأ الاختبار من نصه."],
            ["ما اللغات المتاحة؟", "العربية والفرنسية والإنجليزية. يمكنك التبديل بينها في أي وقت."],
            ["هل يعمل على الهاتف؟", "نعم. يمكنك تثبيته من المتصفح أو تحميل تطبيق أندرويد."],
            ["كيف أدفع ثمن Pro؟", "عبر بطاقة الذهبية أو CIB من خلال Chargily."],
            ["كيف أكسب XP؟", "تكسب XP من جلسات التركيز والمهام المنجزة والاختبارات والحفاظ على سلسلتك اليومية. وXP يرفع مستواك وترتيبك."],
            ["هل أستطيع التنافس مع أصدقائي؟", "نعم. أضف أصدقاءك وقارن تقدمكم في قائمة المتصدرين."],
        ],
    },
    footer: { product: "المنتج", account: "الحساب", follow: "تابعنا", signin: "تسجيل الدخول", register: "إنشاء حساب" },
};

const fr: Copy = {
    nav: { features: "Fonctionnalités", how: "Comment ça marche", pricing: "Tarifs", faq: "FAQ" },
    how: {
        label: "Comment ça marche",
        title: "Du PDF à l'entraînement en trois étapes",
        steps: [
            { title: "Importez le PDF de votre cours", desc: "Ajoutez un cours, un chapitre ou un résumé, jusqu'à 10 Mo." },
            { title: "Obtenez un quiz IA", desc: "Choisissez la difficulté et le nombre de questions. Votre quiz est prêt en environ 20 secondes, avec indices et explications." },
            { title: "Gagnez des XP, gardez votre série", desc: "Les quiz, les sessions de concentration et les tâches terminées rapportent des XP. Grimpez au classement avec vos amis." },
        ],
    },
    quiz: {
        label: "Générateur de quiz IA",
        title: "Transformez n'importe quel chapitre en test d'entraînement",
        desc: "Importez un PDF et obtenez des QCM avec des indices et une explication claire après chaque réponse, pour apprendre de vos erreurs au lieu de simplement les compter.",
        points: ["Difficulté facile, moyenne, difficile ou mixte", "Un indice avant de répondre", "Une explication après avoir répondu"],
        progress: "Question 3 sur 10",
        level: "Moyen",
        q: "Quel organite produit l'essentiel de l'ATP de la cellule ?",
        opts: ["Noyau", "Mitochondrie", "Ribosome", "Appareil de Golgi"],
        ok: "Correct",
        why: "Les mitochondries produisent l'ATP par la respiration cellulaire.",
    },
    algeria: {
        label: "Conçu pour les étudiants en Algérie",
        title: "Des outils adaptés à votre façon d'étudier",
        items: [
            { title: "Calculateur de moyenne", desc: "Calcul de moyenne avec modes Grandes Écoles et université générale, coefficients inclus." },
            { title: "Arabe, français et anglais", desc: "Changez de langue à tout moment. L'interface arabe s'affiche de droite à gauche." },
            { title: "Fonctionne sur votre téléphone", desc: "Installez-le depuis votre navigateur ou téléchargez l'application Android." },
        ],
        mockTitle: "Moyenne",
        rows: [["Mathématiques", "×4", "14.50"], ["Physique", "×3", "12.00"]],
        avg: "Moyenne",
        avgValue: "13.43",
    },
    pricing: {
        label: "Tarifs",
        title: "Commencez gratuitement, passez à Pro quand il le faut",
        free: { name: "Gratuit", price: "0 DA", note: "Pour toujours", items: ["7 quiz IA par mois", "Minuteur Pomodoro, tâches et calendrier", "XP, séries et classement", "Calculateur de moyenne"], cta: "Créer un compte gratuit" },
        pro: { name: "Pro", price: "500 DA", note: "par mois", items: ["Quiz IA illimités", "Tout ce qui est dans Gratuit", "Paiement par EDAHABIA ou CIB"], cta: "Commencer" },
        footnote: "Vous pouvez passer à Pro à tout moment depuis l'application.",
    },
    faq: {
        label: "FAQ",
        title: "Des questions ? Des réponses.",
        items: [
            ["Nahda.Edu est-il gratuit ?", "Oui. Le plan gratuit inclut tous les outils avec 7 quiz IA par mois. Pro, à 500 DA par mois, supprime cette limite."],
            ["Puis-je utiliser mes propres PDF ?", "Oui. Importez un PDF jusqu'à 10 Mo et le quiz est généré à partir de son texte."],
            ["Quelles langues sont disponibles ?", "L'arabe, le français et l'anglais. Vous pouvez changer à tout moment."],
            ["Est-ce que ça fonctionne sur téléphone ?", "Oui. Installez-le depuis votre navigateur ou téléchargez l'application Android."],
            ["Comment payer Pro ?", "Par carte EDAHABIA ou CIB via Chargily."],
            ["Comment gagner des XP ?", "Vous gagnez des XP avec les sessions de concentration, les tâches terminées, les quiz et votre série quotidienne. Les XP font monter votre niveau et votre rang."],
            ["Puis-je me mesurer à mes amis ?", "Oui. Ajoutez vos amis et comparez vos progrès dans le classement."],
        ],
    },
    footer: { product: "Produit", account: "Compte", follow: "Suivez-nous", signin: "Se connecter", register: "Créer un compte" },
};

const COPY: Record<Language, Copy> = { en, ar, fr };

export function useLandingCopy() {
    const { language, isRTL } = useLanguage();
    return { ...COPY[language], dir: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr" };
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-14 border-t border-border/60">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">{children}</div>
        </section>
    );
}

function Heading({ label, title, desc }: { label: string; title: string; desc?: string }) {
    return (
        <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">{label}</p>
            <h2 className="mt-3 text-3xl font-display font-semibold tracking-tight sm:text-4xl">{title}</h2>
            {desc && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{desc}</p>}
        </div>
    );
}

export function HowItWorks() {
    const c = useLandingCopy();
    const icons = [Upload, Sparkles, Trophy];
    return (
        <Section id="how-it-works">
            <Heading label={c.how.label} title={c.how.title} />
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
                {c.how.steps.map((s, i) => {
                    const Icon = icons[i];
                    return (
                        <div key={s.title} className="border-t border-border/60 pt-6">
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

export function QuizPreview() {
    const c = useLandingCopy();
    const q = c.quiz;
    return (
        <Section id="quiz">
            <div className="grid items-center gap-12 lg:grid-cols-2">
                <div>
                    <Heading label={q.label} title={q.title} desc={q.desc} />
                    <ul className="mt-8 space-y-3">
                        {q.points.map((p) => (
                            <li key={p} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <Card aria-hidden="true" className="p-5 text-start">
                    <div className="flex items-center justify-between">
                        <Badge variant="muted">{q.progress}</Badge>
                        <Badge variant="secondary">{q.level}</Badge>
                    </div>
                    <p className="mt-4 font-display text-base font-semibold">{q.q}</p>
                    <div className="mt-4 space-y-2">
                        {q.opts.map((o, i) => (
                            <div
                                key={o}
                                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm ${i === 1 ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                                    }`}
                            >
                                <span className="font-mono text-xs">{"ABCD"[i]}</span>
                                {o}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-start gap-2.5 rounded-md bg-muted/50 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                            <p className="text-sm font-medium">{q.ok}</p>
                            <p className="text-sm text-muted-foreground">{q.why}</p>
                        </div>
                    </div>
                </Card>
            </div>
        </Section>
    );
}

export function ForAlgeria() {
    const c = useLandingCopy();
    const a = c.algeria;
    const icons = [Calculator, Languages, Smartphone];
    return (
        <Section id="algeria">
            <Heading label={a.label} title={a.title} />
            <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
                <div className="space-y-8">
                    {a.items.map((item, i) => {
                        const Icon = icons[i];
                        return (
                            <div key={item.title} className="border-t border-border/60 pt-6">
                                <div className="flex items-center gap-2.5">
                                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                                    <h3 className="font-display text-base font-semibold">{item.title}</h3>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                            </div>
                        );
                    })}
                </div>

                <Card aria-hidden="true" className="p-5 text-start">
                    <p className="font-display text-sm font-medium">{a.mockTitle}</p>
                    <div className="mt-4 divide-y divide-border">
                        {a.rows.map(([name, coef, grade]) => (
                            <div key={name} className="flex items-center justify-between py-2.5 text-sm">
                                <span>{name}</span>
                                <span className="flex items-center gap-4 font-mono text-muted-foreground">
                                    <span>{coef}</span>
                                    <span className="text-foreground">{grade}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-3">
                        <span className="text-sm font-medium">{a.avg}</span>
                        <span className="font-mono text-2xl font-semibold text-primary">{a.avgValue}</span>
                    </div>
                </Card>
            </div>
        </Section>
    );
}

export function Pricing() {
    const c = useLandingCopy();
    const p = c.pricing;
    const plans = [
        { ...p.free, highlight: false, variant: "outline" as const },
        { ...p.pro, highlight: true, variant: "default" as const },
    ];
    return (
        <Section id="pricing">
            <Heading label={p.label} title={p.title} />
            <div className="mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col p-6 ${plan.highlight ? "border-primary/50" : ""}`}>
                        <p className="font-display text-sm font-medium text-muted-foreground">{plan.name}</p>
                        <p className="mt-3 flex items-baseline gap-2">
                            <span className="font-display text-4xl font-semibold tracking-tight">{plan.price}</span>
                            <span className="text-sm text-muted-foreground">{plan.note}</span>
                        </p>
                        <ul className="mt-6 flex-1 space-y-2.5">
                            {plan.items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant={plan.variant} className="mt-6 w-full">
                            <Link href="/register">{plan.cta}</Link>
                        </Button>
                    </Card>
                ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{p.footnote}</p>
        </Section>
    );
}

export function Faq() {
    const c = useLandingCopy();
    return (
        <Section id="faq">
            <Heading label={c.faq.label} title={c.faq.title} />
            <div className="mt-10 max-w-3xl divide-y divide-border border-y border-border">
                {c.faq.items.map(([question, answer]) => (
                    <details key={question} className="group py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                            {question}
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
                    </details>
                ))}
            </div>
        </Section>
    );
}

export function FooterLinks() {
    const c = useLandingCopy();
    const link = "text-sm text-muted-foreground transition-colors hover:text-foreground";
    return (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-3">
                <p className="text-sm font-medium">{c.footer.product}</p>
                <ul className="space-y-2">
                    <li><a href="#features" className={link}>{c.nav.features}</a></li>
                    <li><a href="#how-it-works" className={link}>{c.nav.how}</a></li>
                    <li><a href="#pricing" className={link}>{c.nav.pricing}</a></li>
                    <li><a href="#faq" className={link}>{c.nav.faq}</a></li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-sm font-medium">{c.footer.account}</p>
                <ul className="space-y-2">
                    <li><Link href="/login" className={link}>{c.footer.signin}</Link></li>
                    <li><Link href="/register" className={link}>{c.footer.register}</Link></li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-sm font-medium">{c.footer.follow}</p>
                <ul className="space-y-2">
                    <li><a href="https://www.instagram.com/nahda_edu_dz" target="_blank" rel="noopener noreferrer" className={link}>Instagram</a></li>
                    <li><a href="https://www.tiktok.com/@nahda_edu_dz" target="_blank" rel="noopener noreferrer" className={link}>TikTok</a></li>
                </ul>
            </div>
        </div>
    );
}