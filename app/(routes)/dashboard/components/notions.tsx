import { getNotions } from "@/actions/get-notions";
import { LightbulbIcon, ExternalLink } from "lucide-react";
import Link from "next/link";

const NotionsBox = async () => {
  const notions: any = await getNotions();

  if (notions.error || !notions || notions === null) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <LightbulbIcon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Second Brain
        </p>
        <p className="text-lg font-semibold text-white mt-1">Not Connected</p>
        <Link
          href="/secondBrain"
          className="inline-flex items-center gap-2 mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>Connect Notion</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <Link href="/secondBrain" className="block group">
      <div className="rounded-2xl border border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <LightbulbIcon className="w-full h-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <LightbulbIcon className="w-6 h-6" />
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Second Brain
          </p>
          <p className="text-3xl font-bold text-white mt-1">
            {notions != null ? notions.length : 0}
          </p>
          <p className="text-sm text-amber-400 mt-1">Notion pages synced</p>
        </div>
      </div>
    </Link>
  );
};

export default NotionsBox;
