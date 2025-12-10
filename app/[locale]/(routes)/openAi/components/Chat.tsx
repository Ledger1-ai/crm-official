"use client";

import React, { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, RefreshCw, Menu, MessageSquare, MoreVertical } from "lucide-react";
import ChatBoard from "./ChatBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/chat/sessions", { method: "GET" });
      if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
      const json = await res.json();
      const list: ChatSession[] = json.sessions ?? [];
      setSessions(list);

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
      if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
      const json = await res.json();
      const created: ChatSession = json.session;
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setCreatingTitle("");
      setCreatingTemporary(false);
      toast.success("Session created");
      setMessages([]);
      if (window.innerWidth < 640) setSidebarOpen(false);
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
      if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
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
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete session`);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success("Session deleted");
    } catch (e: any) {
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
      if (!res.ok) throw new Error(`Failed to rename session`);

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
      if (!res.ok) throw new Error(`Failed to update session`);

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
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="relative flex w-full h-full overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 inset-y-0 left-0 w-80 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out sm:static sm:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">Chats</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => loadSessions()} disabled={loadingSessions}>
            <RefreshCw className={cn("w-4 h-4", loadingSessions && "animate-spin")} />
          </Button>
        </div>

        {/* New Chat Form */}
        <div className="p-4 space-y-3 border-b border-border bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={creatingTitle}
              onChange={(e) => setCreatingTitle(e.target.value)}
              placeholder="New chat title..."
              className="bg-background"
            />
            <Button onClick={createSession} disabled={loadingSessions} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between px-1">
            <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer">
              <Switch.Root
                className="w-8 h-4 bg-muted-foreground/30 rounded-full relative data-[state=checked]:bg-primary transition-colors"
                checked={creatingTemporary}
                onCheckedChange={setCreatingTemporary}
              >
                <Switch.Thumb className="block w-3 h-3 bg-background rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-4.5" />
              </Switch.Root>
              Temporary Chat
            </label>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No chats yet. Start a new one!
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                activeSessionId === s.id && "bg-muted shadow-sm border border-border/50"
              )}
              onClick={() => {
                setActiveSessionId(s.id);
                if (window.innerWidth < 640) setSidebarOpen(false);
              }}
            >
              <MessageSquare className={cn(
                "w-4 h-4 shrink-0",
                activeSessionId === s.id ? "text-primary" : "text-muted-foreground"
              )} />

              <div className="flex-1 min-w-0">
                {renamingSessionId === s.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => renameSession(s.id)}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenamingSessionId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="truncate text-sm font-medium">{s.title || "Untitled Chat"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()} • {s.isTemporary ? "Temp" : "Saved"}
                    </span>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setRenamingSessionId(s.id);
                    setRenameTitle(s.title || "");
                  }}>
                    <Pencil className="w-3 h-3 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    toggleTemporary(s.id, !s.isTemporary);
                  }}>
                    {s.isTemporary ? <Check className="w-3 h-3 mr-2" /> : <X className="w-3 h-3 mr-2" />}
                    {s.isTemporary ? "Make Persistent" : "Make Temporary"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50">
        <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-sm sm:text-base">
                {activeSession?.title || "Varuni AI Assistant"}
              </h1>
              {activeSession && (
                <span className="text-[10px] text-muted-foreground">
                  {activeSession.isTemporary ? "Temporary Session" : "Persistent Session"}
                </span>
              )}
            </div>
          </div>
        </div>

        {activeSessionId ? (
          <ChatBoard
            key={activeSessionId}
            sessionId={activeSessionId}
            initialMessages={messages as any[]}
            isTemporary={activeSession?.isTemporary || false}
            onRefresh={() => loadMessages(activeSessionId)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-6 bg-primary/5 rounded-full ring-1 ring-primary/10">
              <MessageSquare className="w-12 h-12 text-primary/50" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-semibold">Start a Conversation</h3>
              <p className="text-muted-foreground text-sm">
                Select an existing chat from the sidebar or create a new one to start chatting with Varuni.
              </p>
              <Button onClick={() => {
                if (window.innerWidth < 640) setSidebarOpen(true);
                // Focus input logic could go here
              }}>
                Open Chats
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
