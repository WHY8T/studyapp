export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A0A14] flex-col justify-between p-12">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        {/* Decorative glows */}
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #00b7ff 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #FF6B6B 0%, transparent 70%)" }}
        />
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime flex items-center justify-center">
              <span className="font-display font-black text-[#0A0A14] text-lg">N</span>
            </div>
            <span className="font-display font-bold text-white text-xl tracking-tight">
              Nahda.Edu
            </span>
          </div>
        </div>
        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <p className="text-lime font-display font-semibold text-sm uppercase tracking-widest">
              Level up your studies
            </p>
            <h1 className="font-display font-black text-white text-5xl leading-tight">
              Study Smarter.
              <br />
              <span className="text-gradient-lime">Level Up.</span>
              <br />
              Win Together.
            </h1>
          </div>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            The productivity platform that turns studying into an adventure. Earn XP, build streaks, and conquer your exams.
          </p>
          {/* Social proof */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {["#00b7ff", "#FF6B6B", "#4ECDC4", "#FF9F43"].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A14]"
                  style={{ background: color }}
                />
              ))}
            </div>
            <p className="text-white/50 text-sm">
              <span className="text-white font-semibold">2,400+</span> students already leveling up
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "94%", label: "Exam pass rate" },
            { value: "3.2h", label: "Avg daily study" },
            { value: "12k", label: "Quizzes generated" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 p-4 bg-white/5">
              <p className="font-display font-bold text-lime text-2xl">{stat.value}</p>
              <p className="text-white/50 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}