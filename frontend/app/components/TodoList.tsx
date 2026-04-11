"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

/* ───────── Types ───────── */
interface Todo {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  createdAt: string;
  completedAt?: string;
  deadline?: string;
  whatsappNotified?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  profilePicture?: string;
}

type Tab = "active" | "completed";
type SortMode = "newest" | "oldest" | "deadline" | "title";

/* ───────── Helpers ───────── */
const API = process.env.NEXT_PUBLIC_API_URL + "/todo";
const WA_SANDBOX_URL = "https://wa.me/14155238886?text=join%20farther-free";

function getHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function timeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) {
    const overMs = Math.abs(diff);
    const m = Math.floor(overMs / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    let label = "Overdue";
    if (d > 0) label = `${d}d ${h % 24}h overdue`;
    else if (h > 0) label = `${h}h ${m % 60}m overdue`;
    else if (m > 0) label = `${m}m overdue`;
    return { label, overdue: true, urgentSoon: false };
  }
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const urgentSoon = m <= 60;
  if (d > 0) return { label: `${d}d ${h % 24}h left`, overdue: false, urgentSoon };
  if (h > 0) return { label: `${h}h ${m % 60}m left`, overdue: false, urgentSoon };
  return { label: `${m}m left`, overdue: false, urgentSoon };
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ───────── Icons (inline SVGs) ───────── */
const Icons = {
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  check: (
    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  clock: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  save: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  sort: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  trophy: (
    <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  qrCode: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
};

/* ───────── Component ───────── */
export default function TodoList() {
  const router = useRouter();

  // Data
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<Tab>("active");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Test notification
  const [testingSend, setTestingSend] = useState(false);
  const [resettingNotifs, setResettingNotifs] = useState(false);

  // Celebration animation
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  /* ───── Data fetching ───── */
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchTodos();
  }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => titleRef.current?.focus(), 100);
  }, [showForm]);

  // Close sort menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTodos((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch(API + "?limit=100&sortBy=createdAt&sortOrder=desc", {
        headers: getHeaders(),
      });
      if (res.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.data && Array.isArray(data.data.data)) {
        setTodos(data.data.data);
      } else if (data.data && Array.isArray(data.data)) {
        setTodos(data.data);
      } else {
        setTodos([]);
      }
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  /* ───── CRUD ───── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || description === "<p><br></p>")
      return;
    setAdding(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          description,
          isComplete: false,
          ...(deadline && { deadline: new Date(deadline).toISOString() }),
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setDeadline("");
        setShowForm(false);
        fetchTodos();
        toast.success("Task created!");
      } else {
        toast.error("Failed to add task");
      }
    } catch {
      toast.error("Failed to add task");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    const updated = !todo.isComplete;
    if (updated) {
      setCelebrateId(todo.id);
      setTimeout(() => setCelebrateId(null), 1500);
    }
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              isComplete: updated,
              completedAt: updated ? new Date().toISOString() : undefined,
            }
          : t,
      ),
    );
    try {
      const res = await fetch(`${API}/${todo.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ isComplete: updated }),
      });
      if (!res.ok) throw new Error();
      if (updated) toast.success("Task completed!");
      else toast("Task reopened", { icon: "\u21a9\ufe0f" });
    } catch {
      toast.error("Failed to update task");
      fetchTodos();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    const oldTodos = [...todos];
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
      setTodos(oldTodos);
    }
    setDeletingId(null);
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditDeadline(
      todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
    );
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    const oldTodos = [...todos];
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: editTitle,
              description: editDescription,
              deadline: editDeadline
                ? new Date(editDeadline).toISOString()
                : t.deadline,
            }
          : t,
      ),
    );
    setEditingId(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          ...(editDeadline && {
            deadline: new Date(editDeadline).toISOString(),
          }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
      setTodos(oldTodos);
    }
  };

  const handleTestNotification = async () => {
    setTestingSend(true);
    try {
      const res = await fetch(API + "/test-notification", {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Test message sent! Check your WhatsApp.");
      } else {
        toast.error(data.message || "Failed to send test message");
      }
    } catch {
      toast.error("Failed to send test notification");
    } finally {
      setTestingSend(false);
    }
  };

  const handleResetNotifications = async () => {
    setResettingNotifs(true);
    try {
      const res = await fetch(API + "/reset-notifications", {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      toast.success(data.message || "Notifications reset!");
      fetchTodos();
    } catch {
      toast.error("Failed to reset notifications");
    } finally {
      setResettingNotifs(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  /* ───── Filtering & Sorting ───── */
  const active = todos.filter((t) => !t.isComplete);
  const completed = todos.filter((t) => t.isComplete);
  const baseList = tab === "active" ? active : completed;

  const filtered = baseList.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortMode) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "deadline": {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const overdueCount = active.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date(),
  ).length;

  const completionRate =
    todos.length > 0 ? Math.round((completed.length / todos.length) * 100) : 0;

  /* ───── Render ───── */
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="white" strokeWidth="1.5" fill="none" />
                <path d="M8 7L11 8.5V11.5L8 13L5 11.5V8.5L8 7Z" fill="white" fillOpacity="0.8" />
              </svg>
            </div>
            <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-sm sm:text-base">
              TaskFlow
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/instructions"
              className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              About
            </Link>
            {user && (
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-xl transition-all ml-1"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
                  {user.name}
                </span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              {Icons.logout}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            {showMobileMenu ? Icons.close : Icons.menu}
          </button>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </Link>
              )}
              <Link
                href="/instructions"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                {Icons.info}
                How it works
              </Link>
              <Link
                href="/about"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                {Icons.info}
                About
              </Link>
              <button
                onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                {Icons.logout}
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              label: "Total",
              value: todos.length,
              color: "text-zinc-900 dark:text-white",
              bg: "bg-white dark:bg-zinc-900",
            },
            {
              label: "Active",
              value: active.length,
              color: "text-indigo-600 dark:text-indigo-400",
              bg: "bg-indigo-50 dark:bg-indigo-950/30",
            },
            {
              label: "Done",
              value: completed.length,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
            },
            {
              label: "Overdue",
              value: overdueCount,
              color:
                overdueCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-400",
              bg:
                overdueCount > 0
                  ? "bg-red-50 dark:bg-red-950/30"
                  : "bg-white dark:bg-zinc-900",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`${s.bg} border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-3 sm:p-4 transition-all hover:shadow-sm animate-fade-in`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5 sm:mb-1 uppercase tracking-wider">
                {s.label}
              </p>
              <p className={`text-xl sm:text-2xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {todos.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-3 sm:p-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                {completionRate}%
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* ── WhatsApp status ── */}
        {user && (
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border text-sm transition-all ${
                user.whatsappNumber
                  ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50 text-amber-700 dark:text-amber-400"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`shrink-0 ${user.whatsappNumber ? "text-emerald-500" : "text-amber-500"}`}>
                  {user.whatsappNumber ? Icons.whatsapp : Icons.warning}
                </span>
                <span className="font-medium text-xs sm:text-sm truncate">
                  {user.whatsappNumber
                    ? `Reminders active \u2014 ${user.whatsappNumber}`
                    : "No WhatsApp number set"}
                </span>
              </div>
              {user.whatsappNumber ? (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {overdueCount > 0 && (
                    <button
                      onClick={handleResetNotifications}
                      disabled={resettingNotifs}
                      className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      {resettingNotifs ? Icons.spinner : "Re-send"}
                    </button>
                  )}
                  <button
                    onClick={handleTestNotification}
                    disabled={testingSend}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    {testingSend ? Icons.spinner : "Test"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                >
                  Set up now
                </Link>
              )}
            </div>

            {/* Sandbox activation with QR code */}
            {user.whatsappNumber && (
              <details className="group">
                <summary className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/20 cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">
                  <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Not receiving messages? Activate WhatsApp first
                </summary>
                <div className="mt-2 bg-white dark:bg-zinc-900 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl p-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-2 sm:shrink-0">
                      <div className="bg-white p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <QRCodeSVG
                          value={WA_SANDBOX_URL}
                          size={120}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">Scan with phone camera</p>
                    </div>
                    {/* Instructions */}
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Scan the QR code or manually send this message to <span className="font-bold text-zinc-800 dark:text-zinc-200">+1 (415) 523-8886</span>:
                      </p>
                      <code className="block bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">
                        join farther-free
                      </code>
                      <a
                        href={WA_SANDBOX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                      >
                        {Icons.whatsapp}
                        Open WhatsApp
                      </a>
                      <p className="text-[10px] text-zinc-400">Each user must do this once to receive reminders.</p>
                    </div>
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* ── Tabs + Search + Add ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            {/* Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-1 gap-1">
              {(["active", "completed"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    tab === t
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {t}
                  <span className="ml-1.5 text-xs opacity-70">
                    {t === "active" ? active.length : completed.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-700"
                >
                  {Icons.sort}
                  <span className="hidden sm:inline">Sort</span>
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-20 animate-scale-in">
                    {(
                      [
                        { value: "newest", label: "Newest first" },
                        { value: "oldest", label: "Oldest first" },
                        { value: "deadline", label: "By deadline" },
                        { value: "title", label: "By title" },
                      ] as { value: SortMode; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortMode(opt.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          sortMode === opt.value
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add button */}
              <button
                onClick={() => setShowForm((v) => !v)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  showForm
                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25"
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${showForm ? "rotate-45" : ""}`}
                >
                  {Icons.plus}
                </span>
                <span className="hidden xs:inline">{showForm ? "Cancel" : "New task"}</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              {Icons.search}
            </span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Add form ── */}
        {showForm && (
          <div className="animate-slide-down bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Icons.plus}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                Create new task
              </h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Title
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Add details, notes, links..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Deadline
                  <span className="ml-1 text-zinc-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
                {deadline && (
                  <p className="mt-1.5 text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                    {Icons.clock}
                    You&apos;ll get a WhatsApp reminder 30 min before this deadline
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={adding || !title.trim() || !description.trim() || description === "<p><br></p>"}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
              >
                {adding ? (
                  Icons.spinner
                ) : (
                  <>
                    {Icons.plus}
                    Create task
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Task list ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5"
              >
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full skeleton shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-48 skeleton rounded-lg" />
                    <div className="h-3 w-72 skeleton rounded-lg" />
                    <div className="h-3 w-24 skeleton rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center animate-fade-in">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 sm:mb-5">
              {tab === "active" ? Icons.clipboard : Icons.trophy}
            </div>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
              {searchQuery
                ? "No matching tasks"
                : tab === "active"
                  ? "No active tasks"
                  : "No completed tasks yet"}
            </p>
            <p className="text-sm text-zinc-400 mt-1.5 max-w-xs px-4">
              {searchQuery
                ? "Try a different search term"
                : tab === "active"
                  ? 'Tap "New task" to create your first task'
                  : "Complete some tasks to see them here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((todo, index) => {
              const dl = todo.deadline ? timeLeft(todo.deadline) : null;
              const isEditing = editingId === todo.id;
              const isCelebrating = celebrateId === todo.id;

              return (
                <div
                  key={todo.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className={`group bg-white dark:bg-zinc-900 border rounded-2xl transition-all duration-300 ${
                      isCelebrating
                        ? "border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900 scale-[1.01]"
                        : confirmDeleteId === todo.id
                          ? "border-red-300 dark:border-red-800 ring-2 ring-red-100 dark:ring-red-950"
                          : todo.isComplete
                            ? "border-zinc-100 dark:border-zinc-800/60"
                            : dl?.overdue
                              ? "border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10"
                              : dl?.urgentSoon
                                ? "border-orange-200 dark:border-orange-900/60"
                                : "border-zinc-200/80 dark:border-zinc-800/60 hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:shadow-sm"
                    }`}
                  >
                    {isEditing ? (
                      /* ── Edit mode ── */
                      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                            Description
                          </label>
                          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                            <ReactQuill
                              theme="snow"
                              value={editDescription}
                              onChange={setEditDescription}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                            Deadline
                          </label>
                          <input
                            type="datetime-local"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(todo.id)}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            {Icons.save}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 sm:px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteId === todo.id ? (
                      /* ── Delete confirmation ── */
                      <div className="p-4 sm:p-5 animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                            <span className="text-red-500">{Icons.trash}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                              Delete this task?
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">
                              &quot;{todo.title}&quot; will be permanently removed.
                            </p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleDelete(todo.id)}
                                className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all"
                              >
                                Yes, delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal view ── */
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggle(todo)}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              todo.isComplete
                                ? "bg-emerald-500 border-emerald-500 scale-110"
                                : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 hover:scale-110 active:scale-95"
                            }`}
                          >
                            {todo.isComplete && Icons.check}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-sm font-semibold mb-1 transition-all duration-300 ${
                                todo.isComplete
                                  ? "text-zinc-500 dark:text-zinc-400 decoration-zinc-300 dark:decoration-zinc-600 line-through decoration-2"
                                  : "text-zinc-900 dark:text-white"
                              }`}
                            >
                              {todo.title}
                            </h3>
                            <div
                              className={`text-sm prose prose-sm max-w-none leading-relaxed [&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:font-medium overflow-hidden ${
                                todo.isComplete
                                  ? "text-zinc-400 dark:text-zinc-500 opacity-80"
                                  : "text-zinc-600 dark:text-zinc-400"
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: todo.description,
                              }}
                            />

                            {/* Metadata badges */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                              {/* Deadline badge */}
                              {todo.deadline && !todo.isComplete && dl && (
                                <span
                                  className={`inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-semibold ${
                                    dl.overdue
                                      ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/60"
                                      : dl.urgentSoon
                                        ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/60 animate-pulse-ring"
                                        : "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/60"
                                  }`}
                                >
                                  {Icons.clock}
                                  <span className="hidden sm:inline">{dl.label}</span>
                                  <span className="sm:hidden">{dl.label.replace(" overdue", "").replace(" left", "")}</span>
                                  <span className="opacity-60 hidden sm:inline">\u00b7</span>
                                  <span className="font-normal hidden sm:inline">
                                    {formatDeadline(todo.deadline)}
                                  </span>
                                </span>
                              )}

                              {/* Completed badge */}
                              {todo.isComplete && todo.completedAt && (
                                <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60 font-medium">
                                  {Icons.checkCircle}
                                  Done {formatDate(todo.completedAt)}
                                </span>
                              )}

                              {/* Notified badge */}
                              {todo.whatsappNotified && !todo.isComplete && (
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-lg border border-violet-200/60 dark:border-violet-900/60 font-medium">
                                  {Icons.whatsapp}
                                  Notified
                                </span>
                              )}

                              {/* Created date */}
                              <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500">
                                Created {formatDate(todo.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions - always visible on mobile */}
                          <div className="shrink-0 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            {!todo.isComplete && (
                              <button
                                onClick={() => startEdit(todo)}
                                className="p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg sm:rounded-xl transition-all"
                                title="Edit"
                              >
                                {Icons.edit}
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDeleteId(todo.id)}
                              disabled={deletingId === todo.id}
                              className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {Icons.trash}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer info ── */}
        {!loading && sorted.length > 0 && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 pb-4">
            Showing {sorted.length} of{" "}
            {tab === "active" ? active.length : completed.length} tasks
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}
      </main>

      {/* ── QR Code Modal ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                Scan to Activate WhatsApp
              </h3>
              <div className="inline-block bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <QRCodeSVG
                  value={WA_SANDBOX_URL}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-zinc-500">
                Scan with your phone camera to open WhatsApp and send the activation message.
              </p>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
