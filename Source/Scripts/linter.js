import { runEslint } from "./process";

export class Linter {
  constructor() {
    this.issues = new IssueCollection();
  }

  async lintDocument(document) {
    const contentRange = new Range(0, document.length);
    const content = document.getTextInRange(contentRange);

    return this.lintString(content, document.uri);
  }

  async lintString(string, uri) {
    runEslint(string, uri, (issues) => {
      this.issues.set(uri, issues);
    });
  }

  removeIssues(uri) {
    this.issues.remove(uri);
  }
}
