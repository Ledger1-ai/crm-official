import { Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
    open: boolean;
};

const AnyLink = Link as any;
const AnyUsers = Users as any;

const PartnerMenu = ({ open }: Props) => {
    const pathname = usePathname();
    const isPath = pathname.includes("partners");
    return (
        <div className="flex flex-row items-center p-2 w-full">
            <AnyLink href={"/partners"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
                <AnyUsers className="w-6 icon" />
                <span className={open ? "" : "hidden"}>Partners</span>
            </AnyLink>
        </div>
    );
};

export default PartnerMenu;
