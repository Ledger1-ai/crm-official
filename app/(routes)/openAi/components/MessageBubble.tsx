"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: string;
}

export function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const onCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={cn(
                "flex w-full gap-4 p-4 mb-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 border">
                {isUser ? (
                    <>
                        <AvatarImage src="/images/user-placeholder.png" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </>
                ) : (
                    <>
                        <AvatarImage src="/images/bot-avatar.png" />
                        <AvatarFallback className="bg-cyan-600 text-white">
                            <Bot className="h-4 w-4" />
                        </AvatarFallback>
                    </>
                )}
            </Avatar>

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/50 rounded-tl-sm"
                )}
            >
                {/* Name & Time */}
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                    <span className="font-semibold">
                        {isUser ? "You" : "Varuni"}
                    </span>
                    {createdAt && (
                        <span>
                            {new Date(createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </div>

                {/* Markdown Content */}
                <div className={cn("prose dark:prose-invert max-w-none text-sm leading-relaxed break-words", isUser && "prose-p:text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground")}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeString = String(children).replace(/\n$/, "");

                                if (!inline && match) {
                                    return (
                                        <div className="relative mt-4 mb-2 rounded-md overflow-hidden border border-border/50 bg-zinc-950">
                                            <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
                                                <span className="text-xs text-zinc-400 font-mono">
                                                    {match[1]}
                                                </span>
                                                <button
                                                    onClick={() => onCopy(codeString)}
                                                    className="text-zinc-400 hover:text-white transition-colors"
                                                    title="Copy code"
                                                >
                                                    {copied ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                            <SyntaxHighlighter
                                                {...props}
                                                style={oneDark}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    padding: "1rem",
                                                    fontSize: "0.875rem",
                                                    backgroundColor: "transparent",
                                                }}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                }
                                return (
                                    <code
                                        className={cn(
                                            "bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-[0.9em]",
                                            className
                                        )}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                            // Custom styling for other elements if needed
                            a: ({ node, ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                                />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul {...props} className="list-disc pl-4 my-2 space-y-1" />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol {...props} className="list-decimal pl-4 my-2 space-y-1" />
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
