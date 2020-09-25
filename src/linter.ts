import type { Linter as EslintLinter } from "eslint";
import { eslintOutputToIssue } from "./eslintOutputToIssue";
import { runEslint } from "./process";

function positionToRange(
  document: TextDocument,
  position: {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
  }
): Range {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let rangeStart = 0;
  let rangeEnd = 0;
  let chars = 0;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (position.line - 1 === lineIndex) {
      rangeStart = chars + position.column - 1;
    }
    if (position.endLine - 1 === lineIndex) {
      rangeEnd = chars + position.endColumn - 1;
      break;
    }
    chars += lineLength;
  }
  return new Range(rangeStart, rangeEnd);
}

export class Linter {
  private _issues = new IssueCollection();
  // note - the order of this should match that of _issues
  private _messages = new Map<
    string,
    ReadonlyArray<EslintLinter.LintMessage>
  >();
  private _processesForPaths: { [path: string]: Disposable | undefined } = {};

  lintDocument(document: TextDocument) {
    if (!document.syntax) {
      return;
    }
    const contentRange = new Range(0, document.length);
    const content = document.getTextInRange(contentRange);

    this.lintString(content, document.uri, document.syntax);
  }

  private lintString(string: string, uri: string, syntax: string) {
    const path = nova.path.normalize(uri);
    this._processesForPaths[path]?.dispose();
    this._processesForPaths[path] = runEslint(
      string,
      path,
      syntax,
      (messages) => {
        delete this._processesForPaths[path];
        this._messages.set(path, messages);
        this._issues.set(path, messages.map(eslintOutputToIssue));
      }
    );
  }

  removeIssues(uri: string) {
    const path = nova.path.normalize(uri);
    this._messages.delete(path);
    this._issues.remove(path);
  }

  getSuggestions(editor: TextEditor) {
    const path = nova.path.normalize(editor.document.uri);
    const messages = this._messages.get(path) ?? [];
    const issues = this._issues.get(path);
    if (messages.length != issues.length) {
      throw new Error("inconsistent data in Linter");
    }
    const message = messages.find((_, i) => {
      // annoyingly, nova doesn't provide a getter for this if col/line is set
      // const issueRange = issues[i].textRange!;
      const issue = issues[i];
      const position = {
        line: issue.line!,
        column: issue.column!,
        endLine: issue.endLine!,
        endColumn: issue.endColumn!,
      };
      const issueRange = positionToRange(editor.document, position);

      return (
        editor.selectedRange.intersectsRange(issueRange) ||
        (editor.selectedRange.empty &&
          issueRange.containsIndex(editor.selectedRange.start))
      );
    });
    return message;
  }
}
