import { readdirSync } from "fs";
import { Dispatcher } from "@mtcute/dispatcher";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const modulesDir = `${__dirname}`;

export interface Module {
  name: string;
  description: string;
  additionalSettings: AdditionalSetting[];
  additionalSettingsDescription: string;
  commands: string[];
  dispatchers: Dispatcher<any>[];
  type: "extra" | "core" | "debug";
}

export interface AdditionalSetting {
  name: string;
  default: any;
  min: number;
  max: number;
  values: string[];
}

export const getModules = async (
  directories: string[],
  dontImport: string[] = []
) => {
  let modules: Module[] = [];
  for (const dir of directories) {
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."))
      .map((dirent) => dirent.name);

    for (const folder of folders) {
      const { default: module }: { default: Module } = await import(
        `${dir}/${folder}/index.js`
      );
      if (module.name == "Settings") {
        continue;
      }
      if (!dontImport.includes(module.name)) {
        modules.push(module);
      }
    }
  }
  return modules;
};

export function getModuleFromName(name: string, modules: Module[]) {
  for (const module of modules) {
    if (name == module.name) {
      return module;
    }
  }
}

export function getSettingFromName(
  name: string,
  settings: AdditionalSetting[]
) {
  for (const setting of settings) {
    if (name == setting.name) {
      return setting;
    }
  }
}

export function changeSetting(
  module: Module,
  setting: AdditionalSetting,
  value: string
) {}
