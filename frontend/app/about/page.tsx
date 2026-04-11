"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white">About</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25 mb-5 sm:mb-6">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none" className="sm:w-8 sm:h-8">
              <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="white" strokeWidth="1.5" fill="none" />
              <path d="M8 7L11 8.5V11.5L8 13L5 11.5V8.5L8 7Z" fill="white" fillOpacity="0.8" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            Task
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Flow</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Smart task management with automated WhatsApp deadline reminders. Never miss a deadline again.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-10 sm:mb-14">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              title: "Smart Task Management",
              desc: "Create, organize, and track your tasks with a clean, intuitive interface. Rich text descriptions, deadlines, and real-time progress tracking.",
              color: "from-indigo-500 to-indigo-600",
              bg: "bg-indigo-50 dark:bg-indigo-950/20",
            },
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
              ),
              title: "WhatsApp Reminders",
              desc: "Get automatic WhatsApp notifications 30 minutes before deadlines and instant alerts when tasks become overdue.",
              color: "from-emerald-500 to-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-950/20",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: "Secure & Private",
              desc: "JWT-based authentication keeps your data safe. Your tasks are private and accessible only to you.",
              color: "from-violet-500 to-violet-600",
              bg: "bg-violet-50 dark:bg-violet-950/20",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ),
              title: "Mobile Friendly",
              desc: "Fully responsive design that works perfectly on phones, tablets, and desktops. Manage tasks from anywhere.",
              color: "from-sky-500 to-sky-600",
              bg: "bg-sky-50 dark:bg-sky-950/20",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className={`${feature.bg} border border-zinc-200/60 dark:border-zinc-800/40 rounded-2xl p-5 sm:p-6 animate-fade-in transition-all hover:shadow-md hover:-translate-y-0.5`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-sm mb-3`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 sm:p-8 mb-10 sm:mb-14 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-4 sm:mb-6 text-center">
            Built With Modern Technology
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: "Next.js 16", desc: "React Framework", icon: "\u26a1" },
              { name: "NestJS", desc: "Backend API", icon: "\ud83d\udee1\ufe0f" },
              { name: "PostgreSQL", desc: "Database", icon: "\ud83d\uddc4\ufe0f" },
              { name: "Twilio", desc: "WhatsApp API", icon: "\ud83d\udce8" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="text-center p-3 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <span className="text-xl sm:text-2xl mb-1.5 block">{tech.icon}</span>
                <p className="font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">{tech.name}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "600ms" }}>
          <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/5 dark:to-violet-500/5 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Ready to get started?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-sm mx-auto">
              Create your free account and start managing tasks with smart reminders today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] text-center"
              >
                Create free account
              </Link>
              <Link
                href="/instructions"
                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all text-center"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 sm:mt-14 pb-6">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} TaskFlow. Free for personal use. Built with care.
          </p>
        </div>
      </main>
    </div>
  );
}
