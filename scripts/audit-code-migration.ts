import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["app", "components", "lib"];
const forbidden = /firebase\/(?:firestore|storage)|firebase-admin\/firestore|\badminDb\b|\bgetFirestore\b|\bgetStorage\b|\bFirestore\b/i;

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? files(join(directory, entry.name))
    : [join(directory, entry.name)]));
  return nested.flat();
}

async function main() {
  const sourceFiles = (await Promise.all(roots.map(files))).flat().filter((file) => /\.(ts|tsx)$/.test(file));
  const matches = (await Promise.all(sourceFiles.map(async (file) => ({ file, source: await readFile(file, "utf8") })))).flatMap(({ file, source }) =>
    source.split(/\r?\n/).flatMap((line, index) => forbidden.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : []));
  console.log(JSON.stringify({ firestoreReferencesRemaining: matches.length, matches }, null, 2));
  if (matches.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error("Code migration audit failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
