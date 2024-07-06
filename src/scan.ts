import { join } from "pathe";

export function scanCommands(dir: string): Promise<string[]> {
  return scanDir(dir);
}

export function scanModules(dir: string): Promise<string[]> {
  return scanDir(dir);
}

async function scanDir(name: string): Promise<string[]> {
  const { globby } = await import("globby");

  const files = await globby(join(name, "*.ts"));

  return files.sort((a, b) => a.localeCompare(b));
}
