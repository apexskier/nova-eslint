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

  return (
    rulesDirs
      .filter((d) => d.trim())
      // hack - JSON stringifying works around https://github.com/eslint/eslint/issues/14025 by forcing levn to parse as a string, not a regex
      // I could try to strip the `/Volumes/Macintosh HD` from Nova's workspace dir, but that would have to be
      // conditional, since global settings won't include it. This feels simpler, although it could break if eslint's options parsing changes
      .map((d) => JSON.stringify(d))
  );
}
