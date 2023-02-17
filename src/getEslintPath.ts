async function npmRoot(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["npm", "root"],
      cwd: nova.workspace.path || nova.extension.path,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        NO_UPDATE_NOTIFIER: "true",
      },
    });
    let result = "";
    process.onStdout((o) => {
      result += o;
    });
    process.onStderr((e) => console.warn("npm root:", e.trimRight()));
    process.onDidExit((status) => {
      if (status === 0) {
        resolve(result.trim());
      } else {
        reject(new Error("failed to npm root"));
      }
    });
    process.start();
  });
}

// this determines where the eslint executable is
export async function getEslintPath(): Promise<string | null> {
  let execPath: string;
  const configExecPath =
    nova.workspace.config.get("apexskier.eslint.config.eslintPath", "string") ??
    nova.config.get("apexskier.eslint.config.eslintPath", "string");
  if (configExecPath) {
    if (nova.path.isAbsolute(configExecPath)) {
      execPath = configExecPath;
    } else if (nova.workspace.path) {
      execPath = nova.path.join(nova.workspace.path, configExecPath);
    } else {
      nova.workspace.showErrorMessage(
        "Save your workspace before using a relative ESLint executable path."
      );
      return null;
    }
  } else {
    const npmRootDir = await npmRoot();
    execPath = nova.path.join(npmRootDir, ".bin/eslint");
    console.log(execPath);
  }

  if (!nova.fs.access(execPath, nova.fs.X_OK)) {
    return null;
  }
  return execPath;
}
