import i18next from "i18next";

import enNs1 from "../@types/locales/en/ns1.json";
import enUsage from "../@types/locales/en/usage.json";
import enErrors from "../@types/locales/en/errors.json";
import itNs1 from "../@types/locales/it/ns1.json";
import itUsage from "../@types/locales/it/usage.json";
import itErrors from "../@types/locales/it/errors.json";

i18next.init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "ns1",
  fallbackNS: "fallback",
  resources: {
    en: {
      ns1: enNs1,
      usage: enUsage,
      errors: enErrors,
    },
    it: {
      ns1: itNs1,
      usage: itUsage,
      errors: itErrors,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
