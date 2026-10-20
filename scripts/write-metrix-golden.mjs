import { writeFileSync } from "node:fs";
// One source-derived case per line keeps exhaustive matrices reviewable without losing fields.
export function writeGolden(path, document) {
  const properties = Object.entries(document).map(([key, value]) => {
    const encoded = Array.isArray(value)
      ? `[\n${value.map(row => `    ${JSON.stringify(row)}`).join(",\n")}\n  ]`
      : JSON.stringify(value, null, 2).replaceAll("\n", "\n  ");
    return `  ${JSON.stringify(key)}: ${encoded}`;
  });
  writeFileSync(path, `{\n${properties.join(",\n")}\n}\n`);
}
