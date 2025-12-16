import React from "react";
import { Wrench } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const AdministrationMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?admin(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/admin"
      icon={Wrench}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default AdministrationMenu;
