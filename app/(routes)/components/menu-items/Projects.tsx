import React from "react";
import { ServerIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const ProjectModuleMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?campaigns(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/campaigns"
      icon={ServerIcon}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default ProjectModuleMenu;
