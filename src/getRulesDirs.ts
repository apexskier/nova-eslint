// returns custom eslint rules directories
export function getRulesDirs(): Array<string> | null {
  const rulesDirs: Array<string> =
    nova.config.get("apexskier.eslint.config.eslintRulesDirs", "array") ?? [];
  const workspaceRulesDirs = nova.workspace.config.get(
    "apexskier.eslint.config.eslintRulesDirs",
    "array"
  );
  if (workspaceRulesDirs) {
    for (const dir of workspaceRulesDirs) {
      if (!dir.trim()) {
        continue;
      }
      if (nova.path.isAbsolute(dir)) {
        rulesDirs.push(dir);
      } else if (nova.workspace.path) {
        rulesDirs.push(nova.path.join(nova.workspace.path, dir));
      } else {
        nova.workspace.showErrorMessage(
          "Save your workspace before using a relative ESLint rules directories."
        );
        return null;
      }
    }
  }

  return rulesDirs.filter((d) => d.trim());
}
