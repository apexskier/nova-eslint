// 
// ESLint Extension for Nova
// main.js
//
// Copyright © 2019 Justin Mecham. All rights reserved.
// 

const Linter = require("./Linter");

exports.activate = function() {
    const linter = new Linter();
    
    nova.workspace.onDidAddTextEditor((editor) => {
        const document = editor.document;

        if (!["javascript", "typescript"].includes(document.syntax)) return;

        linter.lintDocument(document);

        editor.onWillSave(editor => linter.lintDocument(editor.document));
        editor.onDidStopChanging(editor => linter.lintDocument(editor.document));
        document.onDidChangeSyntax(document => linter.lintDocument(document));
    
        editor.onDidDestroy(destroyedEditor => {
            let anotherEditor = nova.workspace.textEditors.find(editor => {
                return editor.document.uri === destroyedEditor.document.uri;
            });
    
            if (!anotherEditor) {
                linter.removeIssues(destroyedEditor.document.uri);
            }
        });
    });
};
