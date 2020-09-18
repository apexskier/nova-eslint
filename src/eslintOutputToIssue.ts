import type { Linter } from "eslint";

export function eslintOutputToIssue(attributes: Linter.LintMessage) {
    const issue = new Issue();

    issue.source = "ESLint";
    if (attributes.ruleId) {
        issue.code = attributes.ruleId;
    }
    issue.message = attributes.message;

    switch (attributes.severity) {
        case 1:
            issue.severity = IssueSeverity.Warning;
            break;
        case 2:
            issue.severity = IssueSeverity.Error;
            break;
        default:
            console.warn("Unknown issue severity", attributes.severity);
            break;
    }

    issue.line = attributes.line;
    issue.endLine = attributes.endLine;
    issue.column = attributes.column;
    issue.endColumn = attributes.endColumn;

    return issue;
}
