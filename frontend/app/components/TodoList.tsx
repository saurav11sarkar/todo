"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import toast from "react-hot-toast";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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

const API = process.env.NEXT_PUBLIC_API_URL + "/todo";

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
  if (diff <= 0) return { label: "Overdue", overdue: true };
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return { label: `${d}d ${h % 24}h left`, overdue: false };
  if (h > 0) return { label: `${h}h ${m % 60}m left`, overdue: false };
  return { label: `${m}m left`, overdue: m < 30 };
}

export default function TodoList() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchTodos();
  }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => titleRef.current?.focus(), 100);
  }, [showForm]);

  const fetchTodos = async () => {
    try {
      const res = await fetch(API, { headers: getHeaders() });
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
        toast.success("Task added successfully");
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
      if (!res.ok) throw new Error("Failed to toggle task");
      if (updated) toast.success("Task marked complete!");
    } catch (error) {
      toast.error("Failed to update task");
      fetchTodos(); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const oldTodos = [...todos];
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to delete");
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
          ...(editDeadline && { deadline: new Date(editDeadline).toISOString() }),
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
      setTodos(oldTodos);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const active = todos.filter((t) => !t.isComplete);
  const completed = todos.filter((t) => t.isComplete);
  const displayed = tab === "active" ? active : completed;
  const overdueCount = active.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date(),
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L14 5V11L8 14L2 11V5L8 2Z"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M8 7L11 8.5V11.5L8 13L5 11.5V8.5L8 7Z"
                  fill="white"
                  fillOpacity="0.8"
                />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white text-sm">
              TaskFlow
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <Link href="/profile" className="hidden sm:flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-xl transition-colors">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user.name}
                </span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total tasks",
              value: todos.length,
              color: "text-zinc-900 dark:text-white",
            },
            {
              label: "Completed",
              value: completed.length,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Overdue",
              value: overdueCount,
              color: overdueCount > 0 ? "text-red-500" : "text-zinc-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp status bar */}
        {user && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
              user.whatsappNumber
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
            }`}
          >
            <span className="text-base">
              {user.whatsappNumber ? "📱" : "⚠️"}
            </span>
            {user.whatsappNumber
              ? `WhatsApp reminders active → ${user.whatsappNumber}`
              : "No WhatsApp number set — deadline reminders are disabled"}
          </div>
        )}

        {/* Tabs + Add button */}
        <div className="flex items-center justify-between">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
            {(["active", "completed"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  tab === t
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t}{" "}
                {t === "active"
                  ? `(${active.length})`
                  : `(${completed.length})`}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showForm
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            }`}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showForm ? "rotate-45" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {showForm ? "Cancel" : "Add task"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 text-sm">
              New task
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                ref={titleRef}
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />

              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-zinc-50 dark:[&_.ql-toolbar]:bg-zinc-900/50 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[100px] [&_.ql-editor]:text-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the task…"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Deadline (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  adding ||
                  !title.trim() ||
                  !description.trim() ||
                  description === "<p><br></p>"
                }
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {adding ? (
                  <svg
                    className="w-4 h-4 animate-spin"
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
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add task
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
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
            <p className="text-sm text-zinc-400">Loading tasks…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              {tab === "active" ? (
                <svg
                  className="w-8 h-8 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              )}
            </div>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              {tab === "active" ? "No active tasks" : "No completed tasks yet"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              {tab === "active"
                ? 'Click "Add task" to get started'
                : "Complete some tasks to see them here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayed.map((todo) => {
              const deadline = todo.deadline ? timeLeft(todo.deadline) : null;
              const isEditing = editingId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`group bg-white dark:bg-zinc-900 border rounded-2xl transition-all ${
                    todo.isComplete
                      ? "border-zinc-100 dark:border-zinc-800 opacity-70"
                      : deadline?.overdue
                        ? "border-red-200 dark:border-red-900"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  {isEditing ? (
                    <div className="p-5 space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-zinc-50 dark:[&_.ql-toolbar]:bg-zinc-900/50 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[80px] [&_.ql-editor]:text-sm">
                        <ReactQuill
                          theme="snow"
                          value={editDescription}
                          onChange={setEditDescription}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                          Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save changes
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggle(todo)}
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            todo.isComplete
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-500"
                          }`}
                        >
                          {todo.isComplete && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-semibold mb-1 ${todo.isComplete ? "line-through text-zinc-400" : "text-zinc-900 dark:text-white"}`}
                          >
                            {todo.title}
                          </h3>
                          <div
                            className={`text-sm prose prose-sm max-w-none leading-relaxed [&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:font-medium overflow-hidden ${todo.isComplete ? "text-zinc-400 line-through" : "text-zinc-500 dark:text-zinc-400"}`}
                            dangerouslySetInnerHTML={{
                              __html: todo.description,
                            }}
                          />

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {todo.deadline && !todo.isComplete && deadline && (
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${
                                  deadline.overdue
                                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                                    : "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900"
                                }`}
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {deadline.label} ·{" "}
                                {new Date(todo.deadline).toLocaleDateString(
                                  "en-BD",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            )}
                            {todo.isComplete && todo.completedAt && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Done{" "}
                                {new Date(todo.completedAt).toLocaleDateString(
                                  "en-BD",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            )}
                            <span className="text-xs text-zinc-400">
                              {new Date(todo.createdAt).toLocaleDateString(
                                "en-BD",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!todo.isComplete && (
                            <button
                              onClick={() => startEdit(todo)}
                              className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                              title="Edit"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(todo.id)}
                            disabled={deletingId === todo.id}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
