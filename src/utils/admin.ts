import { filters, UpdateFilter } from "@mtcute/dispatcher";
import { Message } from "@mtcute/node";

const hasPerms = (): UpdateFilter<Message> => (msg) => {
  return;
};

const getUsers;
