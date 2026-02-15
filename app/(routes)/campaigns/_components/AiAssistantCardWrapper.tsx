"use client";

import React from "react";
import AiAssistant from "./AiAssistant";
import { Sparkles } from "lucide-react";
import { ProjectCard, ProjectCardData } from "./ProjectCard";

type Props = {
    session: any;
};

const AiAssistantCardWrapper = ({ session }: Props) => {
    const card: ProjectCardData = {
        title: "AI Report",
        description: "Generate campaign status report",
        icon: Sparkles,
        color: "from-pink-500/20 to-rose-500/20",
        iconColor: "text-pink-400"
    };

    return (
        <AiAssistant
            session={session}
            customTrigger={(loading: boolean) => (
                <ProjectCard card={card} loading={loading} />
            )}
        />
    );
};

export default AiAssistantCardWrapper;
