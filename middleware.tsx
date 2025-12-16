import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "de", "cz", "uk"],
  defaultLocale: "en",
});

export const config = {
  // Skip all paths that should not be internationalized
  // portal - public SMS message portal (outside locale)
  matcher: ["/((?!api|_next|voicehub|portal|.*\\..*).*)"],
};
