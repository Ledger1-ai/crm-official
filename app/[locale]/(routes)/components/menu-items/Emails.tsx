import React from "react";
import { Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const EmailsModuleMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?emails(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/emails"
      icon={Mail}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default EmailsModuleMenu;
