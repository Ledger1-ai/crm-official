import React from "react";
import { FormInput } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
    open: boolean;
    isMobile?: boolean;
};

const FormBuilderModuleMenu = ({ open, isMobile = false }: Props) => {
    const pathname = usePathname();
    const isPath = /^\/([a-z]{2}\/)?messages\/forms(\/|$)/.test(pathname);

    return (
        <MenuItem
            href="/messages/forms"
            icon={FormInput}
            title="Form Builder"
            isOpen={open}
            isActive={isPath}
            isMobile={isMobile}
        />
    );
};

export default FormBuilderModuleMenu;
