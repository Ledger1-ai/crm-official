import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FileText, Briefcase, BookOpen, Globe, Share2, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import Changelog from "./components/Changelog";

export default async function CMSDashboardPage() {
  const session = await getServerSession(authOptions);

  const contentSections = [
    {
      title: "Blog",
      description: "Manage blog posts and articles",
      href: "blog",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Careers",
      description: "Manage job postings",
      href: "careers",
      icon: Briefcase,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Documentation",
      description: "Manage help docs and guides",
      href: "docs",
      icon: BookOpen,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Footer",
      description: "Edit footer sections and links",
      href: "footer",
      icon: Globe,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Social Media",
      description: "Configure social links",
      href: "social",
      icon: Share2,
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      title: "Users",
      description: "Manage CMS users",
      href: "users",
      icon: Users,
      color: "bg-cyan-500/10 text-cyan-500",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(" ")[0] || "Admin"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your website content from here.
        </p>
      </div>

      {/* Status Banner */}
      <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-emerald-700 dark:text-emerald-300">
          CMS is live and connected to your website.
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Content Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {contentSections.map((section) => (
              <Link
                key={section.href}
                href={`/cms/${section.href}`}
                className="group p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${section.color}`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Log - Side Panel */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-8">
            <Changelog />
          </div>
        </div>
      </div>
    </div>
  );
}
