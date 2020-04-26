import { runEslint } from "./process";

export class Linter {
    constructor() {
        this.issues = new IssueCollection();
        this._active = {};
    }

    lintDocument(document) {
        const contentRange = new Range(0, document.length);
        const content = document.getTextInRange(contentRange);

        this.lintString(content, document.uri);
    }

    lintString(string, uri) {
        if (this._active[uri]) {
            this._active[uri].kill();
        }
        this._active[uri] = runEslint(string, uri, (issues) => {
            delete this._active[uri];
            this.issues.set(uri, issues);
        });
    }

    removeIssues(uri) {
        this.issues.remove(uri);
    }
}
