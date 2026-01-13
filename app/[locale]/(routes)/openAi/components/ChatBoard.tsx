"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { Loader, Send, Square, RefreshCw, ArrowDown, Download, MoreVertical } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatScore } from "./ChatScore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatMessage = {
    id: string;
    session: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
};

const MAX_TOKENS = 275000;

function estimateTokens(text: string): number {
    if (!text) return 0;
    const c = text.trim().length;
    // Rough estimate: ~4 characters per token
    return Math.ceil(c / 4);
}

interface ChatBoardProps {
    sessionId: string;
    initialMessages: ChatMessage[];
    isTemporary: boolean;
    onRefresh: () => void;
}

export default function ChatBoard({ sessionId, initialMessages, isTemporary, onRefresh }: ChatBoardProps) {
    const [localInput, setLocalInput] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);

    const apiEndpoint = "/api/chat";

    const chatHelpers = useChat({
        id: sessionId,
        messages: initialMessages as any[],
        onError: (err: unknown) => {
            console.error("[CHAT_STREAM_ERROR]", err);
            toast.error(`Streaming error: ${(err as Error).message || "Unknown error"}`);
        },
        onFinish: ({ message, messages: allMessages }: any) => {
            if (allMessages && allMessages.length > 0) {
                const normalizedMessages = allMessages.map((m: any) => ({
                    ...m,
                    content: m.content || (m.parts ? m.parts.map((p: any) =>
                        typeof p === 'string' ? p : (p.text || p.content || '')
                    ).join('') : ''),
                }));
                setMessages(normalizedMessages);
            } else if (message) {
                const assistantContent = message.content || (message.parts ? message.parts.map((p: any) =>
                    typeof p === 'string' ? p : (p.text || p.content || '')
                ).join('') : '');

                const assistantMessage = {
                    id: message.id || crypto.randomUUID(),
                    role: 'assistant',
                    content: assistantContent,
                    createdAt: new Date().toISOString(),
                    session: sessionId,
                };
                setMessages((prev: any[]) => [...prev, assistantMessage]);
            }
            onRefresh();
        }
    });

    const {
        messages,
        sendMessage,
        stop,
        isLoading,
        setMessages,
    } = chatHelpers as any;

    const initialMessagesKey = useMemo(
        () => initialMessages.map(m => m.id).join(','),
        [initialMessages]
    );

    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            const currentIds = messages.map((m: any) => m.id).join(',');
            const initialIds = initialMessages.map(m => m.id).join(',');
            if (currentIds !== initialIds) {
                setMessages(initialMessages as any[]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMessagesKey, setMessages]);

    const usedTokens = useMemo(() => {
        const messageTokens = (messages || []).reduce((sum: number, m: any) => sum + estimateTokens(m.content), 0);
        const inputTokens = estimateTokens(localInput);
        return messageTokens + inputTokens;
    }, [messages, localInput]);

    const percentUsed = Math.min(100, Math.round((usedTokens / MAX_TOKENS) * 100));

    const listRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const content = localInput.trim();
        if (!content) return;

        setLocalInput("");

        try {
            if (sendMessage) {
                const userMessage = {
                    role: 'user' as const,
                    parts: [{ type: 'text', text: content }],
                };
                sendMessage(userMessage, { body: { sessionId } });
            }
        } catch (err) {
            toast.error("Failed to send message.");
            console.error(err);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            if (form) form.requestSubmit();
        }
    };

    const handleExport = () => {
        if (!messages.length) return;
        const text = messages.map((m: any) => `[${new Date(m.createdAt).toLocaleString()}] ${m.role.toUpperCase()}:\n${m.content || (m.parts ? m.parts.map((p: any) => typeof p === 'string' ? p : (p.text || '')).join('') : '')}\n`).join("\n---\n\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-export-${sessionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Chat exported!");
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 relative bg-background/50">
            {/* Header (Context & Refresh) */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-full border shadow-sm">
                <ChatScore sessionId={sessionId} />
                <div className="w-px h-4 bg-border mx-1" />
                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${percentUsed >= 90 ? "bg-red-500" : percentUsed >= 75 ? "bg-yellow-500" : "bg-blue-500"}`}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                        />
                    </div>
                    <span>{percentUsed}% Context</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onRefresh}>
                            <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="w-3 h-3 mr-2" /> Export Chat
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages list */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth custom-scrollbar"
            >
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <RefreshCw className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Welcome to Varuni</h3>
                                <p className="text-sm text-muted-foreground">Start a conversation to get assistance.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((m: any) => {
                        const displayContent = m.content || (m.parts ? m.parts.map((p: any) =>
                            typeof p === 'string' ? p : (p.text || p.content || '')
                        ).join('') : '');

                        return (
                            <MessageBubble
                                key={m.id}
                                role={m.role}
                                content={displayContent}
                                createdAt={m.createdAt}
                            />
                        );
                    })}

                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-4 animate-pulse">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Varuni is thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-32 md:bottom-24 right-4 md:right-8 rounded-full shadow-lg z-20"
                    onClick={() => scrollToBottom()}
                >
                    <ArrowDown className="w-4 h-4" />
                </Button>
            )}

            {/* Composer */}
            <div className="p-4 pb-20 md:pb-4 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={onSubmit} className="relative flex items-end gap-2 p-2 bg-card border rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Textarea
                            className="min-h-[50px] max-h-[200px] w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-4"
                            placeholder="Message Varuni..."
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <div className="flex pb-2 pr-2">
                            {isLoading ? (
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="rounded-xl h-10 w-10"
                                    onClick={() => stop()}
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="rounded-xl h-10 w-10"
                                    disabled={!localInput.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                    <div className="text-center mt-2 pb-1">
                        <p className="text-[10px] text-muted-foreground">
                            AI can make mistakes. Please review generated code and advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
