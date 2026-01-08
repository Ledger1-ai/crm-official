"use client";

import React, { useEffect, useState } from "react";
import { ThemedLogo } from "@/components/ThemedLogo";
const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Mobile Footer - Marquee at the very top of the page */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-6 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30 overflow-hidden flex items-center"
      >
        <div className="animate-marquee whitespace-nowrap text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          <span className="mx-8">BasaltCRM</span>
          <span className="mx-8">•</span>
          <span className="mx-8">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          <span className="mx-8">•</span>
          <span className="mx-8">Powered by AI</span>
          <span className="mx-8">•</span>
          <span className="mx-8">Next Generation CRM</span>
          <span className="mx-8">•</span>
          <span className="mx-8">BasaltCRM</span>
          <span className="mx-8">•</span>
          <span className="mx-8">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          <span className="mx-8">•</span>
          <span className="mx-8">Powered by AI</span>
          <span className="mx-8">•</span>
          <span className="mx-8">Next Generation CRM</span>
        </div>
      </div>

      {/* Desktop Footer - Sticky at Bottom with Glass Effect and Rounded Top Corners */}
      <footer className="hidden md:flex rounded-t-xl relative bottom-0 z-40 h-10 items-center justify-end px-5 text-xs text-muted-foreground bg-background/60 backdrop-blur-xl border-t border-border/30 shadow-lg">
        <div className="flex items-center gap-2">
          <span>v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          <ThemedLogo variant="wide" className="h-5 w-auto opacity-70" />
        </div>
      </footer>
    </>
  );
};

export default Footer;
