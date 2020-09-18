import { runEslint } from "./process";

export class Linter {
    private issues = new IssueCollection();
    private _active: { [path: string]: Process | undefined } = {};

    lintDocument(document: TextDocument) {
        const contentRange = new Range(0, document.length);
        const content = document.getTextInRange(contentRange);

        this.lintString(content, document.uri);
    }

    lintString(string: string, uri: string) {
        const path = nova.path.normalize(uri);
        this._active[path]?.kill();
        this._active[path] = runEslint(string, path, (issues) => {
            delete this._active[path];
            this.issues.set(path, issues);
        });
    }

    removeIssues(uri: string) {
        const path = nova.path.normalize(uri);
        this.issues.remove(path);
    }
}
