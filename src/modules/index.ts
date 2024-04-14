import { Dispatcher } from "@mtcute/dispatcher";

export interface Module {
    name: string;
    help: string;
    dispatchers: Dispatcher[];
    type: "extra" | "core" | "debug";
}