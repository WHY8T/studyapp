import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Timer,
  Brain,
  Trophy,
  Users,
  CheckSquare,
  Calendar,
  Zap,
  ArrowRight,
  Star,
  Flame,
  Code2,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Timer,
      title: "Pomodoro Timer",
      description: "Focus in deep work sprints. Track every session and earn XP as you study.",
      color: "#00b7ff",
    },
    {
      icon: Brain,
      title: "AI Quiz Generator",
      description: "Upload any PDF and get an instant personalized quiz. Study smarter with AI.",
      color: "#4ECDC4",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn XP, level up, unlock badges, and maintain study streaks.",
      color: "#FF6B6B",
    },
    {
      icon: Users,
      title: "Social Study",
      description: "Add friends, compete on leaderboards, and hold each other accountable.",
      color: "#FF9F43",
    },
    {
      icon: CheckSquare,
      title: "Smart Tasks",
      description: "Organize tasks by subject, priority, and deadline. Never miss a thing.",
      color: "#BB8FCE",
    },
    {
      icon: Calendar,
      title: "Study Calendar",
      description: "Plan sessions, track exams, and visualize your entire study schedule.",
      color: "#45B7D1",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08080F] text-white overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
            <span className="font-display font-black text-[#0D0D18] text-base">N</span>
          </div>
          <span className="font-display font-bold text-xl">Nahda.Edu</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-lime text-[#0D0D18] hover:bg-lime-300">
              Get started free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-16 pb-24 max-w-7xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #00b7ff 0%, transparent 70%)" }}
        />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lime/30 bg-lime/10 text-lime text-sm font-semibold">
            <Zap className="w-4 h-4" />
            Study. Earn XP. Level Up. Repeat.
          </div>
          <h1 className="font-display font-black text-6xl lg:text-8xl leading-none tracking-tight">
            Study Smarter.
            <br />
            <span className="text-gradient-lime">Level Up.</span>
          </h1>
          <p className="text-white/60 text-xl max-w-2xl mx-auto leading-relaxed">
            The only productivity platform that makes studying addictive. Pomodoro sessions, AI quizzes,
            real-time leaderboards, and a friends system built for students.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="xl" className="text-base shadow-xl shadow-lime/20">
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base">
                Sign in
              </Button>
            </Link>
          </div>
          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex -space-x-2">
              {["#00b7ff", "#FF6B6B", "#4ECDC4", "#FF9F43", "#BB8FCE"].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#08080F]" style={{ background: color }} />
              ))}
            </div>
            <p className="text-white/50 text-sm">
              <span className="text-white font-semibold">2,400+</span> students already leveling up
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-lime text-lime" />
              ))}
              <span className="text-white/50 text-sm ml-1">4.9/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-y border-white/10 py-8 bg-white/3">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 px-8 text-center">
          {[
            { value: "94%", label: "Pass rate improvement" },
            { value: "3.2h", label: "Average daily study" },
            { value: "12K+", label: "AI quizzes generated" },
            { value: "50K+", label: "Study sessions completed" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-4xl text-lime">{s.value}</p>
              <p className="text-white/50 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-24 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <p className="text-lime font-semibold text-sm uppercase tracking-widest">Everything you need</p>
          <h2 className="font-display font-black text-4xl lg:text-5xl">
            Built for serious students
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Every feature designed to keep you motivated, organized, and making progress.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 p-6 bg-white/3 hover:bg-white/5 transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${feature.color}15` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 max-w-3xl mx-auto text-center">
        <div className="rounded-3xl border border-lime/20 bg-lime/5 p-12 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-6 h-6 text-lime" />
            <span className="text-lime font-semibold">Start your streak today</span>
          </div>
          <h2 className="font-display font-black text-4xl">
            Ready to level up your studies?
          </h2>
          <p className="text-white/60 leading-relaxed">
            Join thousands of students who have transformed how they study.
            Free forever. No credit card required.
          </p>
          <Link href="/register">
            <Button size="xl" className="text-lg shadow-2xl shadow-lime/30">
              Create free account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/40 text-sm">
            🎁 Get +100 XP just for signing up
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-lime flex items-center justify-center">
            <span className="font-display font-black text-[#0D0D18] text-sm">N</span>
          </div>
          <span className="font-display font-bold">Nahda.Edu</span>
        </div>
        <p className="text-white/30 text-sm">© 2025 Nahda.Edu. Built for students, by students.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
          <Code2 className="w-3.5 h-3.5 text-lime" />
          <span className="text-white/50 text-xs">
            Designed & built by{" "}
            <span className="text-lime font-semibold">Ghoubali Abdelwaheb</span>
            {" "}— a student, for students 🎓
          </span>
        </div>
      </footer>
    </div>
  );
}