import { fileURLToPath } from "node:url";
import { defineCittyModule, addCommand } from "../../src";

export default defineCittyModule({
  setup(cmd) {
    console.log("Setup auth module");

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const resolve = (path: string) =>
      fileURLToPath(new URL(path, import.meta.url));

    addCommand(cmd, {
      name: "login",
      command: resolve("./auth/login.ts"),
    });
  },
});
