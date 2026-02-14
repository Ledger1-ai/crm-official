"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useGreeting } from "@/app/hooks/use-greeting";

export default function WelcomeMessage() {
    const { data: session } = useSession();
    const greeting = useGreeting();

    // Get first name safely or fallback to email username
    const userName = session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "there";

    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {greeting}, {userName}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
                This is your Command Center.
            </p>
        </div>
    );
}
