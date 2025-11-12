import { Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  title: string;
};

const AdministrationMenu = ({ open, title }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("admin");
  return (
    <div className="flex flex-row items-center p-2 w-full">
      <Link href={"/admin"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <Wrench className="w-6 icon" />
        <span className={open ? "" : "hidden"}>{title}</span>
      </Link>
    </div>
  );
};

export default AdministrationMenu;
