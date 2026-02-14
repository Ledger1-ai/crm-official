import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import { Book, Code, Github, Terminal, Zap, Shield, Globe } from "lucide-react";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-cyan-500/30 selection:text-cyan-50">
      <BasaltNavbar />

      <main className="pt-32 pb-16 px-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Future</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive resources, guides, and API references for building with BasaltCRM.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card
              icon={<Book className="w-6 h-6 text-cyan-400" />}
              title="Documentation"
              description="Deep dive into BasaltCRM's architecture, core concepts, and guides."
              href="/docs"
            />
            <Card
              icon={<Terminal className="w-6 h-6 text-cyan-400" />}
              title="API Reference"
              description="Complete reference documentation for the REST and GraphQL APIs."
              href="#"
            />
            <Card
              icon={<Github className="w-6 h-6 text-cyan-400" />}
              title="Contributing"
              description="Learn how to contribute to the core codebase and join the community."
              href="https://github.com/BasaltHQ/crm-official"
            />
            <Card
              icon={<Zap className="w-6 h-6 text-cyan-400" />}
              title="Workflows & Automation"
              description="Extend Basalt with custom AI agents and automated sequences."
              href="#"
            />
            <Card
              icon={<Shield className="w-6 h-6 text-cyan-400" />}
              title="Authentication"
              description="Secure your integrations using OAuth2 and API Key management."
              href="#"
            />
            <Card
              icon={<Globe className="w-6 h-6 text-cyan-400" />}
              title="Webhooks"
              description="Real-time event notifications for your external applications."
              href="#"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Need help?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Our engineering team is always available on Discord to help you build your custom integrations.
            </p>
            <a href="https://discord.gg/gcgNugyWkg" className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all">
              Join Discord Community
            </a>
          </div>
        </div>
      </main>

      <BasaltFooter />
    </div>
  );
}

function Card({ icon, title, description, href }: { icon: any, title: string, description: string, href: string }) {
  return (
    <a href={href} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all hover:bg-white/[0.07]">
      <div className="mb-4 p-3 rounded-lg bg-cyan-950/30 w-fit group-hover:bg-cyan-950/50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </a>
  );
}
