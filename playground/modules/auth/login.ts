import consola from "consola";
import { defineCommand } from "../../../src";

export default defineCommand({
  meta: {
    name: "login",
    description: "Login to the application",
  },
  args: {
    username: {
      type: "string",
      description: "Username",
      required: true,
    },
    password: {
      type: "string",
      description: "Password",
      required: true,
    },
  },
  run({ args }) {
    consola.success(`Logging in as ${args.username}`);
  },
});
