import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { Module } from "#bot/modules/index.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const dp = Dispatcher.child();

const runPythonInDocker = async (code: string) => {
  const dockerCommand = `
  docker run --rm -i python:3.9 python3 -c "${code}"
  `;
  try {
    const { stdout, stderr } = await execAsync(dockerCommand);
    if (stderr) {
      return `Error: ${stderr}`;
    }
    return stdout;
  } catch (error) {
    console.log(error);
  }
};

dp.onNewMessage(
  async (ctx) => {
    return (
      ctx.sender.id == 611938392 &&
      ctx.entities[0].params.kind == "pre" &&
      ctx.entities[0].params.language == "python"
    );
  },
  async (ctx) => {
    console.log("Python code detected");
    console.log(ctx.entities[0]);
    const code = ctx.entities[0].text.replaceAll('"', '\\"');
    console.log(code);
    const result = await runPythonInDocker(code);
    ctx.edit({ text: `${result}` });
  }
);

const mod: Module = {
  name: "Miscellaneous",
  description: "Run Python code in the chat",
  additionalSettings: [
    {
      name: "dockerImage",
      default: "python:3.9",
      min: 1,
      max: 1,
      values: ["python:3.9", "python:3.8", "python:3.7"],
    },
  ],
  additionalSettingsDescription: "",
  commands: [],
  dispatchers: [dp],
  type: "extra",
};

export default mod;
