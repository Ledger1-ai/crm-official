import React from "react";
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
    open: boolean;
    title: string;
    isMobile?: boolean;
};

const MessagesModuleMenu = ({ open, title, isMobile = false }: Props) => {
    const pathname = usePathname();
    const isPath = /^\/([a-z]{2}\/)?messages(\/|$)/.test(pathname);

    return (
        <MenuItem
            href="/messages"
            icon={MessageSquare}
            title={title}
            isOpen={open}
            isActive={isPath}
            isMobile={isMobile}
        />
    );
};

export default MessagesModuleMenu;
