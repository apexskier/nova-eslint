// 
// ESLint Extension for Nova
// Linter.js
//
// Copyright © 2019-2020 Justin Mecham. All rights reserved.
// 

const ESLintProcess = require("./ESLintProcess");

class Linter {

    constructor() {
        this.issues = new IssueCollection();
        this.process = new ESLintProcess();
    }

    async lintDocument(document) {
        const contentRange = new Range(0, document.length);
        const content = document.getTextInRange(contentRange);

        return this.lintString(content, document.uri);
    }

    async lintString(string, uri) {
        this.process.onComplete(offenses => {
            this.issues.set(uri, offenses.map(offense => offense.issue));
        });

        this.process.execute(string, uri);
    }

    removeIssues(uri) {
        this.issues.remove(uri);
    }

}

module.exports = Linter;
