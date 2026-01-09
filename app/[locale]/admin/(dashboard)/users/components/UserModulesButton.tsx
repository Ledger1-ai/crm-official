"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfigureModulesModal from "../../modules/components/ConfigureModulesModal";

interface UserModulesButtonProps {
    userId: string;
    userName: string;
    currentModules?: string[];
    onSave?: (userId: string, modules: string[]) => void;
}

export default function UserModulesButton({
    userId,
    userName,
    currentModules = [],
    onSave,
}: UserModulesButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (modules: string[]) => {
        onSave?.(userId, modules);
        // TODO: API call to save user-specific modules
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-8 w-8 p-0"
                title="Configure user modules"
            >
                <Settings2 className="w-4 h-4" />
            </Button>

            <ConfigureModulesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roleName={userName}
                enabledModules={currentModules}
                onSave={handleSave}
            />
        </>
    );
}
