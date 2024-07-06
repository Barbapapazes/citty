import { existsSync } from "node:fs";
import consola from "consola";
import jiti from "jiti";
import type { ArgsDef, CittyModule, CommandDef } from "./types";
import { loadLocalCommands, resolveSubCommand, runCommand } from "./command";
import { CLIError } from "./_utils";
import { showUsage as _showUsage } from "./usage";
import { scanModules } from "./scan";

export interface RunMainOptions {
  rawArgs?: string[];
  commandsDir?: string;
  modulesDir?: string;
  showUsage?: typeof _showUsage;
}

export async function runMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunMainOptions = {},
) {
  /**
   * Load local modules
   */
  const modulesDir = opts.modulesDir ?? "modules";
  if (existsSync(modulesDir)) {
    const modules = await scanModules(modulesDir);

    const _jiti = jiti(import.meta.url, {
      interopDefault: true,
      esmResolve: true,
    });

    for (const modulePath of modules) {
      const module = _jiti(modulePath) as CittyModule;
      await module.setup(cmd);
    }
  }

  /**
   * Load local commands
   */
  const commandsDir = opts.commandsDir ?? "commands";
  if (existsSync(commandsDir)) {
    await loadLocalCommands(cmd, commandsDir);
  }

  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const showUsage = opts.showUsage || _showUsage;
  try {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      process.exit(0);
    } else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
      const meta =
        typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
      if (!meta?.version) {
        throw new CLIError("No version specified", "E_NO_VERSION");
      }
      consola.log(meta.version);
    } else {
      await runCommand(cmd, { rawArgs });
    }
  } catch (error: any) {
    const isCLIError = error instanceof CLIError;
    if (!isCLIError) {
      consola.error(error, "\n");
    }
    if (isCLIError) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
    }
    consola.error(error.message);
    process.exit(1);
  }
}

export function createMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
): (opts?: RunMainOptions) => Promise<void> {
  return (opts: RunMainOptions = {}) => runMain(cmd, opts);
}
