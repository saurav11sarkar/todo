"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TodoList from "./components/TodoList";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else setMounted(true);
  }, [router]);

  if (!mounted)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M8 7L11 8.5V11.5L8 13L5 11.5V8.5L8 7Z" fill="white" fillOpacity="0.8" />
          </svg>
        </div>
        <p className="text-sm text-zinc-400 font-medium">Loading TaskFlow...</p>
      </div>
    );

  return <TodoList />;
}
