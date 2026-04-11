"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const WA_SANDBOX_URL = "https://wa.me/14155238886?text=join%20farther-free";

export default function InstructionsPage() {
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
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white">How It Works</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Setup Guide
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
            Get Started with TaskFlow
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Follow these simple steps to set up task management with WhatsApp deadline reminders.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 sm:space-y-6 mb-10 sm:mb-14">
          {[
            {
              step: 1,
              title: "Create Your Account",
              desc: "Sign up with your name, email, and password. Optionally add your WhatsApp number (BD format: 01XXXXXXXXX).",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              ),
              color: "from-indigo-500 to-indigo-600",
              action: (
                <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Go to Register
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ),
            },
            {
              step: 2,
              title: "Activate WhatsApp Reminders",
              desc: "Scan the QR code below or open WhatsApp and send the activation message. This connects your WhatsApp to receive reminders.",
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
              ),
              color: "from-emerald-500 to-emerald-600",
              hasQr: true,
            },
            {
              step: 3,
              title: "Create Tasks with Deadlines",
              desc: "Add tasks with titles, rich text descriptions, and optional deadlines. The app tracks your progress automatically.",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
              color: "from-violet-500 to-violet-600",
            },
            {
              step: 4,
              title: "Get Automatic Reminders",
              desc: "TaskFlow sends a WhatsApp reminder 30 minutes before each deadline. If a task becomes overdue, you get an instant alert.",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ),
              color: "from-amber-500 to-orange-500",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 sm:p-6 transition-all hover:shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Step {item.step}</span>
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* QR Code section for step 2 */}
                    {item.hasQr && (
                      <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                              <QRCodeSVG
                                value={WA_SANDBOX_URL}
                                size={140}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                                includeMargin={false}
                              />
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium">Scan with phone camera</p>
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                              Or manually send this message:
                            </p>
                            <div className="space-y-1.5">
                              <p className="text-xs text-zinc-500">
                                Send to: <span className="font-bold text-zinc-800 dark:text-zinc-200">+1 (415) 523-8886</span>
                              </p>
                              <code className="block bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all">
                                join farther-free
                              </code>
                            </div>
                            <a
                              href={WA_SANDBOX_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              Open WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.action && <div className="mt-3">{item.action}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="mb-10 sm:mb-14 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-4 sm:mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Why am I not receiving WhatsApp messages?",
                a: "You need to activate the WhatsApp Sandbox first. Scan the QR code above or send \"join farther-free\" to +1 (415) 523-8886 from your WhatsApp. Each user must do this once.",
              },
              {
                q: "When are reminders sent?",
                a: "TaskFlow sends a reminder 30 minutes before your deadline. If a task passes its deadline without completion, you get an overdue notification. The system checks every minute.",
              },
              {
                q: "Can I use a different WhatsApp number?",
                a: "Yes! Go to your Profile settings and update your WhatsApp number. Make sure to re-activate the sandbox from that new number.",
              },
              {
                q: "Is TaskFlow free to use?",
                a: "Yes, TaskFlow is completely free for personal use. No credit card needed, no hidden fees.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                  {faq.q}
                  <svg className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed animate-fade-in">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "700ms" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Managing Tasks
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 sm:mt-14 pb-6">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} TaskFlow. Free for personal use.
          </p>
        </div>
      </main>
    </div>
  );
}
