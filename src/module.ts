import {
  CommandDef,
  AddCommandOptions,
  SubCommandsDef,
  CittyModule,
} from "./types";

/**
 * Define a module.
 */
export function defineCittyModule(module: CittyModule): CittyModule {
  return module;
}

/**
 * Utility function to add a command from a module.
 */
export function addCommand(cmd: CommandDef, options: AddCommandOptions) {
  cmd.subCommands = cmd.subCommands || {};

  (cmd.subCommands as SubCommandsDef)[options.name] = () =>
    import(options.command).then((mod) => mod.default);
}
