import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import Header from "./components/Header";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";
import { Metadata } from "next";
import RecentActivityTracker from "@/components/RecentActivityTracker";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import UtilityBar from "@/components/UtilityBar";


function getSafeMetadataBase(): URL {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  if (!envUrl || envUrl.trim() === "") {
    return new URL(PRODUCTION_FALLBACK);
  }

  const trimmed = envUrl.trim();

  // Skip localhost URLs in production
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return new URL(PRODUCTION_FALLBACK);
  }

  // Ensure URL has protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return new URL(`https://${trimmed}`);
  }

  return new URL(trimmed);
}

export const metadata: Metadata = {
  metadataBase: getSafeMetadataBase(),
  title: "BasaltCRM Dashboard",
  description: "Manage your sales and support with AI.",
  openGraph: {
    images: [
      {
        url: "/api/og?title=Dashboard&description=Manage%20your%20business",
        width: 1200,
        height: 630,
        alt: "BasaltCRM Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/api/og?title=Dashboard&description=Manage%20your%20business",
        width: 1200,
        height: 630,
        alt: "BasaltCRM Dashboard",
      },
    ],
  },
};
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  //console.log(session, "session");

  if (!session) {
    return redirect("/sign-in");
  }

  const user = session?.user;

  if (user?.userStatus === "PENDING") {
    return redirect("/pending");
  }

  if (user?.userStatus === "INACTIVE") {
    return redirect("/inactive");
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] overflow-hidden">
      <RecentActivityTracker />
      <SideBar />
      <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
        <Header
          id={session.user.id as string}
          name={session.user.name as string}
          email={session.user.email as string}
          avatar={session.user.image as string}
          lang={session.user.userLanguage as string}
        />
        <SmartBreadcrumb />
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <UtilityBar />
        <Footer />
      </div>
    </div>
  );
}
