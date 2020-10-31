import type { Linter, ESLint } from "eslint";
import { getEslintPath } from "./getEslintPath";
import { getEslintConfig } from "./getEslintConfig";

let eslintPath: string | null = null;
let eslintConfigPath: string | null = null;
nova.config.onDidChange("apexskier.eslint.config.eslintPath", async () => {
  eslintPath = await getEslintPath();
  console.log("Updating ESLint executable globally", eslintPath);
  nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
});
nova.workspace.config.onDidChange(
  "apexskier.eslint.config.eslintPath",
  async () => {
    eslintPath = await getEslintPath();
    console.log("Updating ESLint executable for workspace", eslintPath);
    nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
  }
);
nova.config.onDidChange("apexskier.eslint.config.eslintConfigPath", () => {
  eslintConfigPath = getEslintConfig();
  console.log("Updating ESLint config globally", eslintConfigPath);
  nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
});
nova.workspace.config.onDidChange(
  "apexskier.eslint.config.eslintConfigPath",
  () => {
    eslintConfigPath = getEslintConfig();
    console.log("Updating ESLint config for workspace", eslintConfigPath);
    nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
  }
);

export async function initialize() {
  eslintPath = await getEslintPath();
  eslintConfigPath = getEslintConfig();
}

const syntaxToRequiredPlugin: { [syntax: string]: string | undefined } = {
  html: "html",
  vue: "vue",
  markdown: "markdown",
};

export type ESLintRunResults = ReadonlyArray<ESLint.LintResult>;

// one idea for a performance improvement here would be to cache the needed results
// on a file path basis.
// Risks
// - if the eslint config or installed packages change it'll be hard to invalidate the cache
// - handling file renaming?
function getConfig(
  eslint: string,
  forPath: string,
  // eslint-disable-next-line no-unused-vars
  callback: (config: Linter.Config) => void
): Disposable {
  const process = new Process(eslint, {
    args: ["--print-config", forPath],
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

function verifyRequiredPlugin(
  eslint: string,
  syntax: string | null,
  path: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (err?: Error) => void
): Disposable {
  // if a plugin is required to parse this syntax we need to verify it's been found for this file
  // check in the config for this file
  const requiredPlugin = syntax && syntaxToRequiredPlugin[syntax];
  if (requiredPlugin && path) {
    return getConfig(eslint, path, (config) => {
      if (!config.plugins?.includes(requiredPlugin)) {
        callback(
          new Error(
            `${syntax} requires installing eslint-plugin-${requiredPlugin}`
          )
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
    eslint: string,
    args: string[],
    // eslint-disable-next-line no-unused-vars
    callback: (output: Error | ESLintRunResults) => void
  ) {
    this._process = new Process(eslint, {
      args,
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
        console.warn(stderr);
        callback(new Error(`failed to lint (${status})`));
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

export function runLintPass(
  content: string,
  path: string | null,
  syntax: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (err: Error | ESLintRunResults) => void
): Disposable {
  const disposable = new CompositeDisposable();
  if (!nova.workspace.path) {
    console.warn(
      "ESLint used without a workspace path, this is unlikely to work properly"
    );
  }
  if (!eslintPath) {
    console.warn("No ESLint path");
    return disposable;
  }
  const eslint = eslintPath;
  const eslintConfig = eslintConfigPath;
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = path
    ? "/" + decodeURI(path).split("/").slice(5).join("/")
    : null;

  disposable.add(
    verifyRequiredPlugin(eslint, syntax, cleanPath, (err) => {
      if (err) {
        callback(err);
      } else {
        const args = ["--format=json", "--stdin"];
        if (cleanPath) {
          args.unshift("--stdin-filename", cleanPath);
        }
        if (eslintConfig) {
          args.unshift("--config", eslintConfig);
        }
        const process = new ESLintProcess(eslint, args, callback);
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
  callback: (err: Error | ESLintRunResults) => void
) {
  const disposable = new CompositeDisposable();
  if (!nova.workspace.path) {
    console.warn(
      "ESLint used without a workspace path, this is unlikely to work properly"
    );
  }
  if (!eslintPath) {
    console.warn("No ESLint path");
    return disposable;
  }
  const eslint = eslintPath;
  const eslintConfig = eslintConfigPath;
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = "/" + decodeURI(path).split("/").slice(5).join("/");

  disposable.add(
    verifyRequiredPlugin(eslint, syntax, cleanPath, (err) => {
      if (err) {
        callback(err);
      } else {
        const args = ["--fix", "--format=json"];
        args.unshift(cleanPath);
        if (eslintConfig) {
          args.unshift("--config", eslintConfig);
        }
        const process = new ESLintProcess(eslint, args, callback);
        disposable.add(process);
      }
    })
  );

  return disposable;
}
