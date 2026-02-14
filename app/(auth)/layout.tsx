import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// Cache bust: Manual removal of next-intl and move to root app
import "@/app/globals.css";
import { AuthFooterWrapper } from "./components/AuthFooterWrapper";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

export const metadata = {
  title: "BasaltCRM | Secure Access",
  description: "Authentication portal for BasaltCRM.",
};

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full">
      <div className="flex justify-between items-center w-full p-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <div className="flex items-center space-x-5">
          <div className="flex items-center border rounded-md p-2">
            <Link href="https://discord.gg/gcgNugyWkg">
              <DiscordLogoIcon className="size-5" />
            </Link>
          </div>
          <div className="flex items-center border rounded-md p-2">
            <Link href="https://github.com/BasaltHQ/crm-official" target="_blank">
              <GitHubLogoIcon className="size-5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="flex items-center grow h-full overflow-hidden">
        {children}
      </div>
      <AuthFooterWrapper />
    </div>
  );
};

export default AuthLayout;
