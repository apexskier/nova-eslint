// 
// ESLint Extension for Nova
// Offense.js
//
// Copyright © 2019-2020 Justin Mecham. All rights reserved.
// 

class Offense {

    constructor(attributes) {
        this.severity = attributes["severity"];
        this.rule = attributes["ruleId"];
        this.message = attributes["message"];
        this.startColumn = attributes["column"];
        this.startLine = attributes["line"];
        this.stopColumn = attributes["endColumn"];
        this.stopLine = attributes["endLine"];
    }

    get issue() {
        const issue = new Issue();

        issue.source = "ESLint";
        issue.code = this.rule;
        issue.message = this.message;

        if (this.severity == 1) {
            issue.severity = IssueSeverity.Warning;
        } else if (this.severity == 2) {
            issue.severity = IssueSeverity.Error;
        }

        issue.line = this.startLine;
        issue.endLine = this.stopLine;
        issue.column = this.startColumn;
        issue.endColumn = this.stopColumn;

        return issue;
    }

}

module.exports = Offense;
