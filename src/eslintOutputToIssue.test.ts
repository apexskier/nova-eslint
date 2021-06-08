import type { Linter } from "eslint";
import { eslintOutputToIssue } from "./eslintOutputToIssue";

(global as any).IssueSeverity = {
  Info: "info",
  Warn: "warn",
  Error: "error",
};

(global as any).Issue = class MockIssue {
  readonly args: ReadonlyArray<any>;
  constructor(...args: Array<any>) {
    this.args = args;
  }
};

describe("eslintOutputToIssue", () => {
  test.each([0, 1, 2])("severity %d", (severity) => {
    expect(
      eslintOutputToIssue({
        column: 1,
        line: 2,
        endColumn: 3,
        endLine: 4,
        ruleId: "rule_id",
        message: "message",
        messageId: "message_id",
        nodeType: "node_type",
        severity: severity as Linter.Severity,
        fix: { text: "fix_text", range: [5, 6] },
        suggestions: [
          {
            desc: "suggestion description",
            fix: { text: "suggestion_fix_text", range: [7, 8] },
          },
        ],
      })
    ).toMatchSnapshot();
  });
});
