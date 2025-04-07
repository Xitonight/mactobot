import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";

const dp = Dispatcher.child();

dp.onNewMessage(filters.command("unparse"), async (upd) => {
  const cmd = md.unparse(upd.textWithEntities);
  console.log(cmd);
});

export { dp };
