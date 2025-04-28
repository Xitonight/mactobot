import i18next from "i18next";

import enNs1 from "../@types/locales/en/ns1.json";
import enUsage from "../@types/locales/en/usage.json";
import enErrors from "../@types/locales/en/errors.json";
import itNs1 from "../@types/locales/it/ns1.json";
import itUsage from "../@types/locales/it/usage.json";
import itErrors from "../@types/locales/it/errors.json";
import Resources from "src/@types/resources";

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

type NestedKeys<T> = {
  [K in keyof T]: T[K] extends object
    ? `${K & string}.${NestedKeys<T[K]>}`
    : `${K & string}`;
}[keyof T];

type LeafKeys<T> = {
  [K in keyof T]: T[K] extends object
    ? K extends string
      ? `${K}:${NestedKeys<T[K]>}`
      : never
    : `${K & string}`;
}[keyof T];

type NamespaceKeys<T, N extends keyof T & string> = {
  [K in keyof T[N]]: T[N][K] extends object
    ? `${N}:${K & string}.${NestedKeys<T[N][K]>}`
    : `${N}:${K & string}`;
}[keyof T[N]];

export type UsageKeys = NamespaceKeys<Resources, "usage">;
export type ErrorKeys = NamespaceKeys<Resources, "errors">;

export type TranslationKey = LeafKeys<Resources>;

export default i18next;
