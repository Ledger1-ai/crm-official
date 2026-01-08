"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const THEME_PRESETS = [
  "obsidian-gold",
  "midnight-protocol",
  "neon-circuit",
  "prismatic-aurora",
  "deep-ocean",
  "crimson-night",
  "monochrome-studio",
  "forest-spectrum",
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="obsidian-gold"
      enableSystem={false}
      themes={[...THEME_PRESETS]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { THEME_PRESETS };
