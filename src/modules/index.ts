import { Dispatcher, UpdateFilter } from "@mtcute/dispatcher";
import { readdirSync } from "fs";
import path from "path";

export class Module {
  readonly name: string;
  readonly type: "module" | "core" | "debug";
  dispatchers: Dispatcher<any>[] = [];
  enabled: boolean;
  path?: string;

  constructor(
    name: string,
    type: "module" | "core" | "debug" = "core",
    enabled: boolean = true,
    path?: string,
  ) {
    if (type === "core" && !enabled) {
      throw new Error("Core modules cannot be disabled.");
    }
    this.path = path;
    this.name = name;
    this.type = type;
    this.enabled = enabled;
  }

  isEnabled = (): UpdateFilter<any> => () => {
    return this.enabled;
  };

  addDispatchers = (...dispatchers: Dispatcher<any>[]) => {
    this.dispatchers.push(...dispatchers);
  };
}

export const findModule = (name: string, modules: Module[]) => {
  for (const mod of modules) if (mod.name == name) return mod;
};

export const getModules = async (
  directory: string | string[],
  importOnly?: string | string[],
  dontImport?: string | string[],
): Promise<{ [key: string]: Module }> => {
  directory = typeof directory === "string" ? [directory] : directory;
  dontImport = typeof dontImport === "string" ? [dontImport] : dontImport;
  importOnly = typeof importOnly === "string" ? [importOnly] : importOnly;
  let modules: { [key: string]: Module } = {};

  for (const dir of directory) {
    const folders = readdirSync(dir);

    for (const folder of folders) {
      const module: Module = await import(path.join(dir, folder)).then(
        (mod) => mod.default,
      );
      if (
        importOnly &&
        importOnly
          .map((mod) => mod.toLowerCase())
          .includes(module.name.toLowerCase())
      ) {
        modules[module.name] = module;
        continue;
      }
      if (
        !dontImport
          ?.map((mod) => mod.toLowerCase())
          .includes(module.name.toLowerCase()) ||
        module.type === "core"
      ) {
        modules[module.name] = module;
      }
    }
  }

  return modules;
};
