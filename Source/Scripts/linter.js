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
        const path = nova.path.normalize(uri);
        if (this._active[path]) {
            this._active[path].kill();
        }
        this._active[path] = runEslint(string, path, (issues) => {
            delete this._active[path];
            this.issues.set(path, issues);
        });
    }

    removeIssues(uri) {
        const path = nova.path.normalize(uri);
        this.issues.remove(path);
    }
}
