import "server-only";

const dictionaries = {
  en: () => import("./locales/en.json").then((module) => module.default),
  cz: () => import("./locales/en.json").then((module) => module.default),
  de: () => import("./locales/en.json").then((module) => module.default),
  uk: () => import("./locales/en.json").then((module) => module.default),
};

export const getDictionary = async (locale: "en" | "cz" | "de" | "uk") => {
  try {
    return await dictionaries[locale || "en"]();
  } catch (e) {
    return await dictionaries.en();
  }
};
