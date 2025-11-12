"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { Loader, Plus, Trash2, Pencil, Check, X, RefreshCw, Menu, Send, Square } from "lucide-react";

type ChatSession = {
  id: string;
  user: string;
  title?: string | null;
  isTemporary: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

type ChatMessage = {
  id: string;
  session: string;
  parent?: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  model?: string | null;
  deployment?: string | null;
};

const MAX_TOKENS = 275000;

function estimateTokens(text: string): number {
  if (!text) return 0;
  const c = text.trim().length;
  // Rough estimate: ~4 characters per token
  return Math.ceil(c / 4);
}

export default function ChatApp() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [creatingTitle, setCreatingTitle] = useState<string>("");
  const [creatingTemporary, setCreatingTemporary] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>("");
  const [editParentId, setEditParentId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(null);

  // Streaming chat hook bound to active session's message endpoint
  const apiEndpoint = useMemo(() => {
    return activeSessionId ? `/api/chat/sessions/${activeSessionId}/messages` : undefined;
  }, [activeSessionId]);

  const {
    messages: streamingMessages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    data,
    error,
    setMessages: setStreamingMessages,
  } = useChat({
    api: apiEndpoint,
    body: { parentId: editParentId },
    // Stream response into a placeholder assistant bubble, then keep it as the final bubble
    onFinish: async () => {
      setEditParentId(undefined);
      const final = streamingMessages[streamingMessages.length - 1];
      if (final?.content && final?.role === "assistant") {
        if (pendingAssistantId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === pendingAssistantId ? { ...m, content: final.content } : m))
          );
          setPendingAssistantId(null);
        } else if (activeSessionId) {
          setMessages((prev) => [
            ...prev,
            {
              id: `tmp-${Date.now()}`,
              session: activeSessionId,
              role: "assistant",
              content: final.content,
              createdAt: new Date().toISOString(),
            } as any,
          ]);
        }
      }
    },
    onError: (err: unknown) => {
      console.error("[CHAT_STREAM_ERROR]", err);
      toast.error("Streaming error");
    },
  });

  useEffect(() => {
    // Clear client-side useChat state when switching sessions to avoid mixing streams
    setStreamingMessages([]);
  }, [activeSessionId, setStreamingMessages]);

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/chat/sessions", { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to fetch sessions: ${res.status}`);
      }
      const json = await res.json();
      const list: ChatSession[] = json.sessions ?? [];
      setSessions(list);

      // Initialize active session if none selected
      if (!activeSessionId && list.length > 0) {
        setActiveSessionId(list[0].id);
      }
    } catch (e) {
      console.error("[LOAD_SESSIONS]", e);
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function createSession() {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: creatingTitle || "New Chat", isTemporary: creatingTemporary }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create session: ${res.status}`);
      }
      const json = await res.json();
      const created: ChatSession = json.session;
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setCreatingTitle("");
      setCreatingTemporary(false);
      toast.success("Session created");
      await loadMessages(created.id);
    } catch (e) {
      console.error("[CREATE_SESSION]", e);
      toast.error("Failed to create session");
    }
  }

  async function loadMessages(sessionId: string | null) {
    if (!sessionId) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }
      const json = await res.json();
      const list: ChatMessage[] = json.messages ?? [];
      setMessages(list);
    } catch (e) {
      console.error("[LOAD_MESSAGES]", e);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete session: ${res.status}`);
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success("Session deleted");
    } catch (e) {
      console.error("[DELETE_SESSION]", e);
      toast.error("Failed to delete session");
    }
  }

  async function renameSession(sessionId: string) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameTitle }),
      });
      if (!res.ok) {
        throw new Error(`Failed to rename session: ${res.status}`);
      }
      const json = await res.json();
      const updated: ChatSession = json.session;
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setRenamingSessionId(null);
      setRenameTitle("");
      toast.success("Session renamed");
    } catch (e) {
      console.error("[RENAME_SESSION]", e);
      toast.error("Failed to rename session");
    }
  }

  async function toggleTemporary(sessionId: string, isTemporary: boolean) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTemporary }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update session: ${res.status}`);
      }
      const json = await res.json();
      const updated: ChatSession = json.session;
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(updated.isTemporary ? "Session set to temporary" : "Session set to persistent");
    } catch (e) {
      console.error("[TOGGLE_TEMPORARY]", e);
      toast.error("Failed to update session");
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // Compose submit handler to pass through to useChat while validating active session
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!activeSessionId) {
      e.preventDefault();
      toast.error("Select or create a session first");
      return;
    }
    // Immediately append the user's message to the visible thread for a smooth UX
    if (input.trim().length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-user-${Date.now()}`,
          session: activeSessionId,
          role: "user",
          content: input,
          createdAt: new Date().toISOString(),
        } as any,
      ]);
      // Create a placeholder assistant bubble that will be filled as streaming progresses
      const tempId = `tmp-assistant-${Date.now()}`;
      setPendingAssistantId(tempId);
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          session: activeSessionId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        } as any,
      ]);
    }
    // Clear the composer immediately for a smooth UX
    setInput("");
    handleSubmit(e);
  }

  const usedTokens = useMemo(() => {
    const messageTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const streamingTokens =
      isLoading && streamingMessages.length > 0
        ? estimateTokens(streamingMessages[streamingMessages.length - 1]?.content || "")
        : 0;
    const inputTokens = estimateTokens(input);
    return messageTokens + streamingTokens + inputTokens;
  }, [messages, isLoading, streamingMessages, input]);

  const percentUsed = useMemo(() => {
    return Math.min(100, Math.round((usedTokens / MAX_TOKENS) * 100));
  }, [usedTokens]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;


  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Auto-scroll to bottom on new messages or streaming updates
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingMessages]);


  return (
    <div className="relative flex w-full h-full min-h-0 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 glass p-3 flex flex-col gap-3 h-full overflow-hidden transform transition-transform duration-200 sm:static sm:z-auto sm:inset-auto sm:w-80 sm:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <button
            title="Refresh sessions"
            className="p-2 rounded hover:bg-muted"
            onClick={() => loadSessions()}
          >
            <RefreshCw className={`w-4 h-4 ${loadingSessions ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Create session */}
        <div className="space-y-2 rounded p-2 glass">
          <input
            className="w-full border border-input rounded p-2 bg-transparent"
            value={creatingTitle}
            onChange={(e) => setCreatingTitle(e.target.value)}
            placeholder="New session title"
          />
          <label
            htmlFor="temp-session"
            className="flex items-center gap-2 text-[11px] whitespace-nowrap text-gray-600 dark:text-gray-400"
          >
            <Switch.Root
              id="temp-session"
              className="inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full bg-gray-300 dark:bg-gray-700 data-[state=checked]:bg-blue-600 transition-colors"
              checked={creatingTemporary}
              onCheckedChange={(checked) => setCreatingTemporary(!!checked)}
              aria-label="Temporary session (do not save messages)"
            >
              <Switch.Thumb className="block h-3 w-3 rounded-full bg-white shadow translate-x-0.5 transition-transform data-[state=checked]:translate-x-4" />
            </Switch.Root>
            Temporary session (do not save messages)
          </label>
          <button
            className="w-full flex items-center justify-center gap-2 bg-primary hover:brightness-90 text-primary-foreground rounded p-2"
            onClick={createSession}
            disabled={loadingSessions}
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-auto">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-2 rounded mb-2 cursor-pointer ${
                s.id === activeSessionId ? "bg-accent/20 border border-accent" : "hover:bg-muted"
              }`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {renamingSessionId === s.id ? (
                      <>
                        <input
                          className="w-full border border-gray-300 dark:border-gray-700 rounded p-1 bg-transparent text-sm"
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          placeholder={s.title || "Untitled"}
                          autoFocus
                        />
                        <button
                          className="p-1 rounded bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            renameSession(s.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingSessionId(null);
                            setRenameTitle("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{s.title || "Untitled"}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {s.isTemporary ? "Temporary" : "Persistent"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title="Rename"
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingSessionId(s.id);
                      setRenameTitle(s.title || "");
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    title={s.isTemporary ? "Make persistent" : "Make temporary"}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemporary(s.id, !s.isTemporary);
                    }}
                  >
                    {s.isTemporary ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    title="Delete"
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-sm text-gray-500">No sessions yet. Create one above.</div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="sm:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(true)}
              title="Open sessions"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">Varuni</h2>
            {activeSession && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                {activeSession.title || "Untitled"} {activeSession.isTemporary ? "(Temporary)" : "(Persistent)"}
              </span>
            )}
          </div>
  <div className="flex items-center gap-4">
    {/* Context window tracker */}
    <div className="w-40 sm:w-64">
      <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
        <span className="text-muted-foreground">Context</span>
        <span className="font-medium">
          {usedTokens.toLocaleString()} / {MAX_TOKENS.toLocaleString()} ({percentUsed}%)
        </span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div
          className={`h-2 rounded transition-all ${
            percentUsed >= 90 ? "bg-red-500" : percentUsed >= 75 ? "bg-yellow-500" : "bg-blue-600"
          }`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
    </div>

    {/* Refresh messages */}
    <button
      className="p-2 rounded hover:bg-muted"
      onClick={() => loadMessages(activeSessionId)}
      disabled={!activeSessionId}
      title="Refresh messages"
    >
      <RefreshCw className={`w-4 h-4 ${loadingMessages ? "animate-spin" : ""}`} />
    </button>
  </div>
        </div>

        {/* Messages list */}
        <div ref={listRef} className={`flex-1 p-4 space-y-4 ${messages.length > 0 || loadingMessages || isLoading ? "overflow-auto" : "overflow-hidden"}`}>
          {loadingMessages && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              Loading messages...
            </div>
          )}
          {!loadingMessages && messages.length === 0 && (
            <div className="text-sm text-gray-500">No messages yet.</div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl p-3 ${
                m.role === "user"
                  ? "border bg-primary/10 border-primary/40 backdrop-blur-md shadow"
                  : "glass"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded bg-muted">
                  {m.role.toUpperCase()}
                </span>
                {m.role === "user" && !activeSession?.isTemporary && (
                  <button
                    className="text-xs p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                    onClick={() => {
                      setEditParentId(m.id);
                      setInput(m.content);
                      toast.info("Editing previous message; this will create a branch.");
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit & Branch
                  </button>
                )}
              </div>

              {/* Streaming indicator integrated inside assistant placeholder bubble */}
              {m.role === "assistant" && m.id === pendingAssistantId && isLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                  <Loader className="w-3 h-3 animate-spin" />
                  Streaming response...
                </div>
              )}

              <div className="mt-2 whitespace-pre-wrap text-sm">
                {m.role === "assistant" && m.id === pendingAssistantId && (isLoading || streamingMessages.length > 0)
                  ? streamingMessages[streamingMessages.length - 1]?.content || ""
                  : m.content}
              </div>
            </div>
          ))}

        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="sticky bottom-0 border-t border-border p-3 bg-card/80 backdrop-blur">
          <div className="glass rounded-xl p-2 sm:p-3 flex items-center gap-2">
            <textarea
              className="flex-1 rounded-xl border border-input bg-background/60 text-foreground placeholder-muted-foreground p-3 resize-none min-h-[56px] max-h-[160px] shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeSessionId ? "Type your message..." : "Create or select a session first"}
              disabled={!activeSessionId}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Stop streaming"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground hover:brightness-90 shadow-sm transition-colors"
                onClick={() => {
                  stop();
                }}
                disabled={!isLoading}
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                type="submit"
                aria-label="Send message"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary hover:brightness-90 text-primary-foreground disabled:opacity-50 shadow-sm transition-colors"
                disabled={!activeSessionId || isLoading || input.trim().length === 0}
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {editParentId && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Branching from message id: {editParentId}{" "}
              <button
                type="button"
                className="ml-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700"
                onClick={() => setEditParentId(undefined)}
              >
                Clear
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
