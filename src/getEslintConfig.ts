// returns project-specific eslint config
export function getEslintConfig(): string | null {
  let eslintConfigPath: string | null = null;
  const workspaceEslintConfigPath = nova.workspace.config.get(
    "apexskier.eslint.config.eslintConfigPath",
    "string"
  );
  if (workspaceEslintConfigPath) {
    if (nova.path.isAbsolute(workspaceEslintConfigPath)) {
      eslintConfigPath = workspaceEslintConfigPath;
    } else if (nova.workspace.path) {
      eslintConfigPath = nova.path.join(
        nova.workspace.path,
        workspaceEslintConfigPath
      );
    } else {
      nova.workspace.showErrorMessage(
        "Save your workspace before using a relative ESLint config path."
      );
      return null;
    }
  }

  if (eslintConfigPath && !nova.fs.access(eslintConfigPath, nova.fs.R_OK)) {
    return null;
  }
  return eslintConfigPath;
}
