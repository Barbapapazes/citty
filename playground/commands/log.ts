import consola from "consola";
import { defineCommand } from "../../src";

/**
 * This command is loaded dynamically.
 */
export default defineCommand({
  meta: {
    name: "log",
    description: "Log a message",
  },
  args: {
    message: {
      type: "string",
      description: "message to log",
      required: true,
    },
  },
  run({ args }) {
    consola.log(args.message);
  },
});
