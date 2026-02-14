"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { File, FileText, Image, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const fileTypes = {
    pdf: { icon: FileText, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    doc: { icon: FileText, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    img: { icon: Image, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    other: { icon: File, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
};

export const RecentFilesWidget = ({ files = [] }: { files?: any[] }) => {
    const getFileType = (mime: string) => {
        if (mime.includes("pdf")) return fileTypes.pdf;
        if (mime.includes("image")) return fileTypes.img;
        if (mime.includes("word") || mime.includes("doc")) return fileTypes.doc;
        return fileTypes.other;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <WidgetWrapper title="Recent Files" icon={File} iconColor="text-blue-400" footerHref="/documents" footerLabel="View All Files">
            <div className="space-y-3 pt-2">
                {files.map((item, index) => {
                    const type = getFileType(item.mimeType || "");
                    const Icon = type.icon;

                    return (
                        <div key={item.id || index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-lg ${type.color}`}>
                                    <Icon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                        <span>{formatSize(item.size)}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span className="truncate">by {item.uploadedBy}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={14} className="text-muted-foreground" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </WidgetWrapper>
    );
};
