"use client";

import * as React from "react";
import { Palette } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Link href="/profile/theme">
      <Button variant="outline" size="icon" title="Theme Studio">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Open Theme Studio</span>
      </Button>
    </Link>
  );
}
