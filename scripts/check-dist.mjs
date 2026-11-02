import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import ts from "typescript";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const requested =
  process.env.VITE_BASE_PATH ??
  (repo && !repo.endsWith(".github.io") ? repo : "");
const normalized = requested.replace(/^\/+|\/+$/g, "");
const base = `/${normalized}${normalized ? "/" : ""}`;
const root = resolve(process.env.DIST_DIR ?? "dist");
const origin = "https://roomfit.invalid";
let checked = 0;

function checkReference(raw, source, relativeTo) {
  if (!raw || raw.startsWith("#") || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw))
    return;
  let url;
  try {
    url = new URL(raw, `${origin}${relativeTo}`);
  } catch {
    throw new Error(`${source}: invalid asset reference ${raw}`);
  }
  if (url.origin !== origin) return;
  if (!url.pathname.startsWith(base))
    throw new Error(`${source}: ${raw} is outside base ${base}`);
  let path;
  try {
    path = decodeURIComponent(url.pathname.slice(base.length));
  } catch {
    throw new Error(`${source}: invalid encoding in ${raw}`);
  }
  const destination = resolve(root, path);
  if (destination !== root && !destination.startsWith(root + sep))
    throw new Error(`${source}: asset escapes dist: ${raw}`);
  if (!existsSync(destination))
    throw new Error(`${source}: missing asset ${raw}`);
  checked++;
}

const html = readFileSync(resolve(root, "index.html"), "utf8");
let htmlAssets = 0;
for (const match of html.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) {
  checkReference(match[2], "index.html", base);
  if (match[2].includes("assets/")) htmlAssets++;
}
if (!htmlAssets)
  throw new Error(`index.html: missing asset references for ${base}`);

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
const assetsDir = resolve(root, "assets");
if (!existsSync(assetsDir)) throw new Error("dist/assets does not exist");
const scripts = filesIn(assetsDir).filter((path) => /\.(?:m?js)$/.test(path));
if (!scripts.length) throw new Error("dist/assets has no JavaScript");
for (const path of scripts) {
  const source = readFileSync(path, "utf8");
  const tree = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  const moduleUrl = `${base}${relative(root, path).split(sep).join("/")}`;
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
        checkReference(node.moduleSpecifier.text, moduleUrl, moduleUrl);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg))
        checkReference(arg.text, moduleUrl, moduleUrl);
    }
    // Vite's dynamic preload map and imported asset URLs use base-relative `assets/...` literals.
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = node.text;
      if (/^\/?assets\//.test(value)) checkReference(value, moduleUrl, base);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
console.log(
  `Checked ${checked} asset references in index.html and ${scripts.length} JavaScript files under ${base}`,
);
