// 
// main.js
//
// Created by Justin Mecham on 11/19/19.
// Copyright © 2019 Justin Mecham. All rights reserved.
// 


exports.activate = function() {
    // Do work when the extension is activated
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}


class IssuesProvider {
    constructor() {
        
    }
    
    provideIssues(editor) {
        let issues = [];
        
        // Create a new issue
        let issue = new Issue();
        
        issue.message = "Invalid syntax: Missing semicolon";
        issue.severity = IssueSeverity.Warning;
        issue.line = 4;
        issue.column = 0;
        
        issues.push(issue);
        
        return issues;
    }
}


nova.assistants.registerIssueAssistant("html", new IssuesProvider());

