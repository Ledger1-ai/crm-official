"use client";

import React from "react";

interface TeamMemberProps {
    name: string;
    role: string;
    imageSrc: string;
    linkedin?: string;
    twitter?: string;
}

export default function TeamMember({ name, role, imageSrc, linkedin, twitter }: TeamMemberProps) {
    return (
        <div className="text-center group flex flex-col items-center">
            <div className="w-[180px] h-[180px] rounded-full overflow-hidden mb-4 relative bg-gray-800">
                {/* Using a simple img tag with onError handling */}

                <img
                    src={imageSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback if image fails
                        (e.target as HTMLImageElement).style.display = 'none';
                        if ((e.target as HTMLImageElement).parentElement) {
                            (e.target as HTMLImageElement).parentElement!.innerText = 'No Image';
                        }
                    }}
                />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-primary text-sm font-medium mb-3">{role}</p>

            <div className="flex gap-3 justify-center">
                {linkedin && (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                    </a>
                )}
                {twitter && (
                    <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                    </a>
                )}
            </div>
        </div>
    );
}
