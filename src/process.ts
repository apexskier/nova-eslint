import type { Linter, ESLint } from "eslint";
import { getEslintPath } from "./getEslintPath";
import { getEslintConfig } from "./getEslintConfig";
import { getRulesDirs } from "./getRulesDirs";

let eslintPath: string | null = null;
let eslintConfigPath: string | null = null;
let eslintRulesDirs: Array<string> | null = null;

// TODO: Clean up these disposables on deactivation
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
nova.config.onDidChange("apexskier.eslint.config.eslintRulesDirs", () => {
  eslintRulesDirs = getRulesDirs();
  console.log("Updating ESLint rules globally");
  nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
});
nova.workspace.config.onDidChange(
  "apexskier.eslint.config.eslintRulesDirs",
  () => {
    eslintRulesDirs = getRulesDirs();
    console.log("Updating ESLint rules for workspace");
    nova.commands.invoke("apexskier.eslint.config.lintAllEditors");
  }
);

export async function initialize() {
  eslintPath = await getEslintPath();
  eslintConfigPath = getEslintConfig();
  eslintRulesDirs = getRulesDirs();
}

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

function verifySupportingPlugin(
  eslint: string,
  syntax: string | null,
  path: string | null,
  // eslint-disable-next-line no-unused-vars
  callback: (message?: string) => void
): Disposable {
  // if a plugin is required to parse this syntax we need to verify it's been found for this file
  // check in the config for this file
  const supportingPlugins = syntax && syntaxToSupportingPlugins[syntax];
  if (supportingPlugins && path) {
    return getConfig(eslint, path, (config) => {
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
    eslint: string,
    args: string[],
    // eslint-disable-next-line no-unused-vars
    callback: (output: ESLintRunResults) => void
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
  if (!eslintPath) {
    console.warn("No ESLint path");
    return disposable;
  }
  const eslint = eslintPath;
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = path
    ? "/" + decodeURI(path).split("/").slice(path.indexOf('/Volumes/Macintosh HD') !== -1 ? 5 : 3).join("/")
    : null;

  disposable.add(
    verifySupportingPlugin(eslint, syntax, cleanPath, (message) => {
      if (message) {
        console.info(message);
      } else {
        const args = ["--format=json", "--stdin"];
        if (cleanPath) {
          args.unshift("--stdin-filename", cleanPath);
        }
        addConfigArguments(args);
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
  callback: (output: ESLintRunResults) => void
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
  // remove file:/Volumes/Macintosh HD from uri
  const cleanPath = "/" + decodeURI(path).split("/").slice(path.indexOf('/Volumes/Macintosh HD') !== -1 ? 5 : 3).join("/");

  disposable.add(
    verifySupportingPlugin(eslint, syntax, cleanPath, (message) => {
      if (message) {
        console.info(message);
      } else {
        const args = ["--fix", "--format=json"];
        args.unshift(cleanPath);
        addConfigArguments(args);
        const process = new ESLintProcess(eslint, args, callback);
        disposable.add(process);
      }
    })
  );

  return disposable;
}
