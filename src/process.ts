import type { Linter, ESLint } from "eslint";
import { getEslintConfig } from "./getEslintConfig";
import { getRulesDirs } from "./getRulesDirs";

const eslintConfigPath: string | null = null;
const eslintRulesDirs: Array<string> | null = null;

const sep = "/";

// // TODO: Clean up these disposables on deactivation
// nova.config.onDidChange("apexskier.eslint.config.eslintConfigPath", () => {
//   eslintConfigPath = getEslintConfig();
//   console.log("Updating ESLint config globally", eslintConfigPath);
//   nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
// });
// nova.workspace.config.onDidChange(
//   "apexskier.eslint.config.eslintConfigPath",
//   () => {
//     eslintConfigPath = getEslintConfig();
//     console.log("Updating ESLint config for workspace", eslintConfigPath);
//     nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
//   }
// );
// nova.config.onDidChange("apexskier.eslint.config.eslintRulesDirs", () => {
//   eslintRulesDirs = getRulesDirs();
//   console.log("Updating ESLint rules globally");
//   nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
// });
// nova.workspace.config.onDidChange(
//   "apexskier.eslint.config.eslintRulesDirs",
//   () => {
//     eslintRulesDirs = getRulesDirs();
//     console.log("Updating ESLint rules for workspace");
//     nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
//   }
// );

// export async function initialize() {
//   eslintConfigPath = getEslintConfig();
//   eslintRulesDirs = getRulesDirs();
// }

const syntaxToSupportingPlugins: {
  [syntax: string]: ReadonlyArray<string> | undefined;
} = {
  html: ["html", "@html-eslint"],
  vue: ["vue"],
  markdown: ["markdown"],
};

export type ESLintRunResults = ReadonlyArray<ESLint.LintResult>;

// one idea for a performance improvement here would be to cache the needed results
// on a file path basis.
// Risks
// - if the eslint config or installed packages change it'll be hard to invalidate the cache
// - handling file renaming?
function getConfig(
  forPath: string,
  // eslint-disable-next-line no-unused-vars
  callback: (config: Linter.Config) => void
): Disposable {
  nova.config.get
  const process = new Process("/usr/bin/env", {
    args: ["npm", "exec", "--package=eslint", "--", "eslint", "--print-config", forPath],
    cwd: nova.workspace.path || undefined,
    stdio: "pipe",
  });
  let configStr = "";
  let stderr = "";
  process.onStdout((line) => (configStr += line));
  process.onStderr((line) => (stderr += line));
  process.onDidExit((status) => {
    const configProcessWasTerminated = status === 15;
    if (status !== 0 && !configProcessWasTerminated) {
      console.warn(stderr);
      throw new Error(`failed to get eslint config for ${forPath}: ${status}`);
    }
    if (configProcessWasTerminated) {
      return;
    }
    callback(JSON.parse(configStr));
  });
  process.start();
  return {
    dispose() {
      process.terminate();
    },
  };
}

function verifySupportingPlugin(
  syntax: string | null,
  path: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (message?: string) => void
): Disposable {
  // if a plugin is required to parse this syntax we need to verify it's been found for this file
  // check in the config for this file
  const supportingPlugins = syntax && syntaxToSupportingPlugins[syntax];
  if (supportingPlugins && path) {
    return getConfig(path, (config) => {
      if (
        !config.plugins?.some((plugin) => supportingPlugins.includes(plugin))
      ) {
        callback(
          `${syntax} requires installing one of the following plugins: ${supportingPlugins
            .map((p) => `eslint-plugin-${p}`)
            .join(", ")}`
        );
      } else {
        callback();
      }
    });
  } else {
    // if plugins aren't required, just lint right away
    callback();
    return { dispose() {} };
  }
}

class ESLintProcess implements Disposable {
  private _process: Process;
  constructor(
    args: string[],
    // eslint-disable-next-line no-unused-vars
    callback: (output: ESLintRunResults) => void
  ) {
    this._process = new Process("/usr/bin/env", {
      args: ["/usr/bin/env", "npm", "exec", "--package", "eslint", "--", "eslint", ...args],
      cwd: nova.workspace.path || undefined,
      stdio: "pipe",
    });

    let lintOutput = "";
    let stderr = "";
    this._process.onStdout((line) => (lintOutput += line));
    this._process.onStderr((line) => (stderr += line));
    this._process.onDidExit((status) => {
      const lintProcessWasTerminated = status === 15;
      // https://eslint.org/docs/user-guide/command-line-interface#exit-codes
      const areLintErrors = status === 1;
      const noLintErrors = status === 0;
      if (!areLintErrors && !noLintErrors && !lintProcessWasTerminated) {
        console.warn("Failed to lint");
        console.group();
        console.warn("stderr: ", stderr);
        console.log("command: ", this._process.command);
        console.log("args: ", ...(this._process.args ?? []));
        console.groupEnd();
        throw new Error(`failed to lint (${status})`);
      }
      if (lintProcessWasTerminated) {
        return;
      }

      const response = JSON.parse(lintOutput) as ESLintRunResults;
      callback(response);
    });
    this._process.start();
  }

  write(content: string) {
    // TODO: Improve readable stream types
    const writer = (this._process.stdin as any).getWriter();
    writer.ready.then(() => {
      writer.write(content);
      writer.close();
    });
  }

  dispose() {
    this._process.terminate();
  }
}

function addConfigArguments(toArgs: Array<string>) {
  if (eslintRulesDirs) {
    for (const dir of eslintRulesDirs) {
      toArgs.unshift("--rulesdir", dir);
    }
  }
  if (eslintConfigPath) {
    toArgs.unshift("--config", eslintConfigPath);
  }
}

function rootDrive() {
  // Until Nova 9, path expansion functions like “normalize()” and “expanduser()”
  // returned paths including the root volume mount point (by default,
  // “/Volumes/Macintosh HD”). Expanding “/” thus gave us the mount point.
  const expanded = nova.path.normalize(sep);
  if (expanded !== sep) return expanded;

  // Since Nova 9, path expansion functions like “normalize()” and “expanduser()”
  // return paths in standard *nix notation, i.e. anchored at “/”. Normalising
  // the mount point gives us “/”, while other volumes are unaffected.
  const root = nova.path.join(sep, "Volumes");
  for (const name of nova.fs.listdir(root)) {
    const path = nova.path.join(root, name);
    if (nova.path.normalize(path) === sep) return path;
  }

  // Our Hail Mary against contract breaches.
  const macDefault = nova.path.join(root, "Macintosh HD");
  if (nova.fs.stat(macDefault)?.isSymbolicLink()) return macDefault;
  throw new Error(`Unable to locate mount point for root path “${sep}”`);
}

function nixalize(path: string) {
  const normalised = nova.path.normalize(path);
  if (!nova.path.isAbsolute(normalised)) return normalised;

  const parts = nova.path.split(normalised);
  if (parts.length < 3 || parts[1] !== "Volumes") return normalised;

  const root = rootDrive();
  const same = nova.path.split(root).every((el, idx) => parts[idx] === el);
  return same ? nova.path.join(sep, ...parts.slice(3)) : normalised;
}

/**
 * Convert a “file://” URI into a a path in a way that conforms to RFC 8089
 * and is resistant to contract changes of Nova’s “decodeURI()” implementation.
 * @see https://en.wikipedia.org/wiki/File_URI_scheme
 * @param {string} uri - The URI to convert.
 * @returns {string} The path, if uri was a file URI.
 */
function decodeFileURI(uri: string) {
  const regex = new RegExp("^file:(//[^/]+)?(?=/)");
  const fileURI = uri.replace(regex, "");
  if (fileURI !== uri) {
    const parts = nova.path.split(fileURI).map((part) => decodeURI(part));
    return nova.path.join(...parts);
  }
  return "";
}

export function runLintPass(
  content: string,
  path: string | null,
  syntax: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (output: ESLintRunResults) => void
): Disposable {
  const disposable = new CompositeDisposable();
  if (!nova.workspace.path) {
    console.warn(
      "ESLint used without a workspace path, this is unlikely to work properly"
    );
  }
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = path ? nixalize(decodeFileURI(path)) : null;

  disposable.add(
    verifySupportingPlugin(syntax, cleanPath, (message) => {
      if (message) {
        console.info(message);
      } else {
        const args = ["--format=json", "--stdin"];
        if (cleanPath) {
          args.unshift("--stdin-filename", cleanPath);
        }
        addConfigArguments(args);
        const process = new ESLintProcess(args, callback);
        disposable.add(process);
        process.write(content);
      }
    })
  );

  return disposable;
}

export function runFixPass(
  path: string,
  syntax: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (output: ESLintRunResults) => void
) {
  const disposable = new CompositeDisposable();
  if (!nova.workspace.path) {
    console.warn(
      "ESLint used without a workspace path, this is unlikely to work properly"
    );
  }
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = nixalize(decodeFileURI(path));

  disposable.add(
    verifySupportingPlugin(syntax, cleanPath, (message) => {
      if (message) {
        console.info(message);
      } else {
        const args = ["--fix", "--format=json"];
        args.unshift(cleanPath);
        addConfigArguments(args);
        const process = new ESLintProcess(args, callback);
        disposable.add(process);
      }
    })
  );

  return disposable;
}
