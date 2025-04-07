import type Resources from "./resources.d.ts";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "ns1";
    resources: Resources;
  }
}
