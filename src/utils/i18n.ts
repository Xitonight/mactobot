import i18next from "i18next";

import enNs1 from "../@types/locales/en/ns1.json";
import itNs1 from "../@types/locales/it/ns1.json";

i18next.init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "ns1",
  fallbackNS: "fallback",
  resources: {
    en: {
      ns1: enNs1,
    },
    it: {
      ns1: itNs1,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
