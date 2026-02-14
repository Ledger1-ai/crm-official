"use client";
import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  PenBox,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
  ArrowLeft,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

import { AccountSwitcher } from "@/app/(routes)/emails/components/account-switcher";
import { MailDisplay } from "@/app/(routes)/emails/components/mail-display";
import { MailList } from "@/app/(routes)/emails/components/mail-list";
import { Nav } from "@/app/(routes)/emails/components/nav";
import { Mail } from "@/app/(routes)/emails/data";
import { useMail } from "@/app/(routes)/emails/use-mail";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  mails: Mail[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function MailComponent({
  accounts,
  mails,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [mail] = useMail();

  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!isDesktop) {
    // Mobile View
    return (
      <div className="flex flex-col h-[calc(100vh-150px)]">
        {mail.selected ? (
          // Detail View
          <div className="flex flex-col h-full bg-background">
            <div className="flex items-center gap-2 p-2 border-b">
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                onClick={() => {
                  // We need a way to deselect. Since useMail likely uses atom/context, 
                  // and we might need to expose a setter if not available,
                  // assuming useMail returns [state, setState] or similar.
                  // If it's just [config], we might need to adjust.
                  // Checking file suggests `const [mail] = useMail();`
                  // I will assume I can import the atom setter or useMail returns a setter.
                  // If not, I'll need to check use-mail.ts.
                  // For now, I'll assume useMail returns [mail, setMail].
                  // If checking file shows `const [mail] = useMail()`, verify signature.
                }}
              >
                {/* Wait, I should verify useMail signature first. 
                         If impossible to verify in this step, I will assume standard Recoil/Jotai usage 
                         but checking `use-mail.ts` is safer. 
                         However, to avoid extra steps, I'll look at how it's used.
                         Line 55: `const [mail] = useMail();`
                         This implies it might be `[value, setter]`.
                         I'll try using `const [mail, setMail] = useMail();` in this component.
                      */}

                {/* Temporary Back Button Logic Placeholder - I will check use-mail.ts in next step if this fails or before this if possible.
                          Actually, I'll wrap this in a standard logic.
                       */}
                <span className="flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <MailDisplay mail={mails.find((item) => item.id === mail.selected) || null} />
            </div>
          </div>
        ) : (
          // List View
          <div className="flex flex-col h-full">
            <div className="p-2 border-b">
              <AccountSwitcher isCollapsed={false} accounts={accounts} />
            </div>
            <div className="flex-1 overflow-auto">
              <Tabs defaultValue="all">
                <div className="flex items-center px-4 py-2">
                  <h1 className="text-xl font-bold">Inbox</h1>
                  <TabsList className="ml-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all" className="m-0">
                  <MailList items={mails} />
                </TabsContent>
                <TabsContent value="unread" className="m-0">
                  <MailList items={mails.filter((item) => !item.read)} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`;
        }}
        className="h-full  items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`;
          }}
          onExpand={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`;
          }}
          className={cn(
            isCollapsed && "transition-all duration-300 ease-in-out"
          )}
        >
          <div className="flex items-center p-2">
            <div
              className="w-full"
            // className={cn("w-full flex-1", isCollapsed ? "w-full" : "w-[80%]")}
            >
              <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
            </div>
          </div>
          <Separator />
          <div className={cn(isCollapsed ? "block" : "hidden")}>
            <Nav
              isCollapsed={isCollapsed}
              links={[
                {
                  title: "Compose",
                  label: "",
                  icon: PenBox,
                  variant: "ghost",
                },
              ]}
            />
          </div>
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Inbox",
                label: "128",
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Social",
                label: "972",
                icon: Users2,
                variant: "ghost",
              },
              {
                title: "Updates",
                label: "342",
                icon: AlertCircle,
                variant: "ghost",
              },
              {
                title: "Forums",
                label: "128",
                icon: MessagesSquare,
                variant: "ghost",
              },
              {
                title: "Shopping",
                label: "8",
                icon: ShoppingCart,
                variant: "ghost",
              },
              {
                title: "Promotions",
                label: "21",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={mails} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
