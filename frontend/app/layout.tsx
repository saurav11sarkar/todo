import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ThemeProvider from "./components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskFlow - Smart Task Manager",
  description:
    "Manage tasks with automatic WhatsApp & SMS deadline reminders. Never miss a deadline again.",
  keywords: ["task manager", "todo", "whatsapp reminders", "deadline tracker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = document.documentElement;
                  var theme = localStorage.getItem('taskflow-theme');
                  if (theme === 'light') {
                    d.classList.remove('dark');
                    d.classList.add('light');
                    d.style.colorScheme = 'light';
                  } else if (theme === 'dark') {
                    d.classList.remove('light');
                    d.classList.add('dark');
                    d.style.colorScheme = 'dark';
                  } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      d.classList.add('dark');
                      d.classList.remove('light');
                      d.style.colorScheme = 'dark';
                    } else {
                      d.classList.remove('dark');
                      d.classList.add('light');
                      d.style.colorScheme = 'light';
                    }
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-[var(--font-inter)]"
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--toast-bg, #18181b)",
              color: "var(--toast-color, #fafafa)",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
              border: "1px solid var(--toast-border, #27272a)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
