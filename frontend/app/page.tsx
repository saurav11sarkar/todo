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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <svg
          className="w-6 h-6 animate-spin text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );

  return <TodoList />;
}
