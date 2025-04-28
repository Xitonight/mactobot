import { Dispatcher, UpdateFilter } from "@mtcute/dispatcher";
import { readdirSync } from "fs";
import { basename, dirname, join } from "path";

export class Module {
  readonly name: string;
  readonly type: "extra" | "core" | "debug";
  dispatchers: Dispatcher<any>[] = [];
  enabled: boolean;

  constructor(params: {
    name: string;
    type?: "extra" | "core" | "debug";
    enabled?: boolean;
  });
  constructor(path: string);
  constructor(
    pathOrParams:
      | {
          name: string;
          type?: "extra" | "core" | "debug";
          enabled?: boolean;
        }
      | string,
  ) {
    if (typeof pathOrParams === "string") {
      this.name = basename(pathOrParams);
      const type = basename(dirname(pathOrParams));
      if (type !== "core" && type !== "extra" && type !== "debug") {
        throw new Error(`Invalid module type: ${type}`);
      } else {
        this.type = type;
      }
      this.enabled = true;
    } else {
      if (pathOrParams.type === "core" && !pathOrParams.enabled) {
        throw new Error("Core modules cannot be disabled.");
      }
      this.name = pathOrParams.name;
      this.type = pathOrParams.type || "extra";
      this.enabled = pathOrParams.enabled || true;
    }
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
      const module: Module = await import(join(dir, folder)).then(
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
