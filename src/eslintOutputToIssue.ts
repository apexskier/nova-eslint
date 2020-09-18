import type { Linter } from "eslint";

function eslintSeverityToNovaSeverity(severity: Linter.Severity) {
    switch (severity) {
        case 0:
            return IssueSeverity.Info;
        case 1:
            return IssueSeverity.Warning;
        case 2:
            return IssueSeverity.Error;
    }
}

export function eslintOutputToIssue(attributes: Linter.LintMessage) {
    const issue = new Issue();

    issue.source = "ESLint";
    if (attributes.ruleId) {
        issue.code = attributes.ruleId;
    }
    issue.message = attributes.message;
    issue.severity = eslintSeverityToNovaSeverity(attributes.severity);
    issue.line = attributes.line;
    issue.endLine = attributes.endLine;
    issue.column = attributes.column;
    issue.endColumn = attributes.endColumn;

    return issue;
}
