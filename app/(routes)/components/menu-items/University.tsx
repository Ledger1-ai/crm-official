"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
    open: boolean;
    title: string;
    isMobile?: boolean;
};

const UniversityModuleMenu = ({ open, title = "University", isMobile = false }: Props) => {
    const pathname = usePathname();
    // Check if current path starts with /crm/university
    const isPath = pathname.startsWith("/crm/university");

    return (
        <MenuItem
            href="/crm/university"
            icon={GraduationCap}
            title={title}
            isOpen={open}
            isActive={isPath}
            isMobile={isMobile}
        />
    );
};

export default UniversityModuleMenu;
