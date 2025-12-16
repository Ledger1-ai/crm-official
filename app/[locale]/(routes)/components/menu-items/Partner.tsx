import React from "react";
import { Users } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
    open: boolean;
    isMobile?: boolean;
};

const PartnerMenu = ({ open, isMobile = false }: Props) => {
    const pathname = usePathname();
    const isPath = /^\/([a-z]{2}\/)?partners(\/|$)/.test(pathname);

    return (
        <MenuItem
            href="/partners"
            icon={Users}
            title="Partners"
            isOpen={open}
            isActive={isPath}
            isMobile={isMobile}
        />
    );
};

export default PartnerMenu;
