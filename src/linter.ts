import { runEslint } from "./process";

export class Linter {
    private _issues = new IssueCollection();
    private _processesForPaths: { [path: string]: Process | undefined } = {};

    lintDocument(document: TextDocument) {
        const contentRange = new Range(0, document.length);
        const content = document.getTextInRange(contentRange);

        this.lintString(content, document.uri);
    }

    lintString(string: string, uri: string) {
        const path = nova.path.normalize(uri);
        this._processesForPaths[path]?.kill();
        this._processesForPaths[path] = runEslint(string, path, (issues) => {
            delete this._processesForPaths[path];
            this._issues.set(path, issues);
        });
    }

    removeIssues(uri: string) {
        const path = nova.path.normalize(uri);
        this._issues.remove(path);
    }
}
