import Feedback from "./Feedback";
import GlobalSearchDialog from "@/components/GlobalSearchDialog";
import AvatarDropdown from "./ui/AvatarDropdown";

import { Separator } from "@/components/ui/separator";
import { SetLanguage } from "@/components/SetLanguage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandComponent } from "@/components/CommandComponent";
import NotificationCenter from "@/components/NotificationCenter";
import SupportComponent from "@/components/support";

type Props = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lang: string;
};

const Header = ({ id, name, email, avatar, lang }: Props) => {
  return (
    <div className="shrink-0 rounded-b-xl relative top-0 z-30 flex h-16 justify-between items-center px-4 md:px-6 lg:px-8 py-3 space-x-5 bg-background/60 backdrop-blur-xl border-b border-border/30 shadow-lg mt-6 md:mt-0">
      <div className="flex-1 min-w-0">
        <GlobalSearchDialog />
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <SetLanguage userId={id} />
        </div>
        <div className="hidden md:block">
          <Feedback />
        </div>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <div className="hidden md:block">
          <NotificationCenter />
        </div>
        <div className="hidden md:block">
          <SupportComponent />
        </div>
        <AvatarDropdown
          avatar={avatar}
          userId={id}
          name={name}
          email={email}
        />
      </div>
    </div>
  );
};

export default Header;
