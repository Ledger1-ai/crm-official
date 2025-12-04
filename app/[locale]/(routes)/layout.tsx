import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import Header from "./components/Header";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";
import getAllCommits from "@/actions/github/get-repo-commits";
import { Metadata } from "next";

function getSafeMetadataBase(): URL {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.ledger1.ai";
  
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
  title: "Ledger1CRM Dashboard",
  description: "Manage your sales and support with AI.",
  openGraph: {
    images: [
      {
        url: "/api/og?title=Dashboard&description=Manage%20your%20business",
        width: 1200,
        height: 630,
        alt: "Ledger1CRM Dashboard",
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
        alt: "Ledger1CRM Dashboard",
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

  const build = await getAllCommits();

  //console.log(typeof build, "build");
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar build={build} />
      <div className="flex flex-col h-full w-full overflow-hidden">
        <Header
          id={session.user.id as string}
          name={session.user.name as string}
          email={session.user.email as string}
          avatar={session.user.image as string}
          lang={session.user.userLanguage as string}
        />
        <div className="flex-grow overflow-y-auto h-full p-5">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
