import { getRequestConfig } from "next-intl/server";

const locales = ["en", "de", "cz", "uk"];

export default getRequestConfig(async ({ requestLocale }) => {
  // This is called during both static generation and runtime
  // requestLocale comes from the middleware or route params
  let locale = await requestLocale;
  
  // Validate locale
  if (!locale || !locales.includes(locale)) {
    locale = "en";
  }
  
  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
    timeZone: "Europe/Prague",
  };
});
