import { resolve } from "pathe";
import type {
  CommandContext,
  CommandDef,
  ArgsDef,
  Resolvable,
  SubCommandsDef,
} from "./types";
import { CLIError, resolveValue } from "./_utils";
import { parseArgs } from "./args";
import { scanCommands } from "./scan";

export function defineCommand<T extends ArgsDef = ArgsDef>(
  def: CommandDef<T>,
): CommandDef<T> {
  return def;
}

export interface RunCommandOptions {
  rawArgs: string[];
  data?: any;
  showUsage?: boolean;
}

export async function runCommand<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunCommandOptions,
): Promise<{ result: unknown }> {
  const cmdArgs = await resolveValue(cmd.args || {});
  const parsedArgs = parseArgs<T>(opts.rawArgs, cmdArgs);

  const context: CommandContext<T> = {
    rawArgs: opts.rawArgs,
    args: parsedArgs,
    data: opts.data,
    cmd,
  };

  // Setup hook
  if (typeof cmd.setup === "function") {
    await cmd.setup(context);
  }

  // Handle sub command
  let result: unknown;
  try {
    const subCommands = await resolveValue(cmd.subCommands);
    if (subCommands && Object.keys(subCommands).length > 0) {
      const subCommandArgIndex = opts.rawArgs.findIndex(
        (arg) => !arg.startsWith("-"),
      );
      const subCommandName = opts.rawArgs[subCommandArgIndex];
      if (subCommandName) {
        if (!subCommands[subCommandName]) {
          throw new CLIError(
            `Unknown command \`${subCommandName}\``,
            "E_UNKNOWN_COMMAND",
          );
        }
        const subCommand = await resolveValue(subCommands[subCommandName]);
        if (subCommand) {
          await runCommand(subCommand, {
            rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1),
          });
        }
      } else if (!cmd.run) {
        throw new CLIError(`No command specified.`, "E_NO_COMMAND");
      }
    }

    // Handle main command
    if (typeof cmd.run === "function") {
      result = await cmd.run(context);
    }
  } finally {
    if (typeof cmd.cleanup === "function") {
      await cmd.cleanup(context);
    }
  }
  return { result };
}

export async function resolveSubCommand<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  rawArgs: string[],
  parent?: CommandDef<T>,
): Promise<[CommandDef<T>, CommandDef<T>?]> {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      return resolveSubCommand(
        subCommand,
        rawArgs.slice(subCommandArgIndex + 1),
        cmd,
      );
    }
  }
  return [cmd, parent];
}

function removeDirPrefix(name: string, dir: string): string {
  return name.replace(new RegExp(`^${dir}/`), "");
}

function removeExtension(name: string): string {
  return name.replace(/\.ts$/, "");
}

/**
 * Resolve all commands from a local directory.
 */
export async function resolveLocalCommands(
  dir: string,
): Promise<Resolvable<SubCommandsDef>> {
  const localCommands = await scanCommands(dir);

  return Object.fromEntries(
    localCommands.map((command) => {
      const name = removeExtension(removeDirPrefix(command, dir));

      return [name, () => import(resolve(command)).then((r) => r.default)];
    }),
  );
}

/**
 * Load all commands from a local directory into a command definition.
 *
 * This allows to create a CLI that automatically loads all commands from a directory to extend the CLI.
 */
export async function loadLocalCommands<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  dir: string,
) {
  const localCommands = await resolveLocalCommands(dir);
  cmd.subCommands = {
    ...cmd.subCommands,
    ...localCommands,
  };
}
