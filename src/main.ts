import { Linter } from "./linter";
import { fixEslint } from "./process";

export function activate() {
    console.log("activating...");

    const linter = new Linter();

    nova.commands.register(
        "apexskier.eslint.command.fix",
        (editor: TextEditor) => {
            if (editor.document.isDirty) {
                console.log("after saving");
                editor.onDidSave(fix);
                editor.save();
            } else {
                fix(editor);
            }

            function fix(editor: TextEditor) {
                if (!editor.document.path) {
                    nova.workspace.showErrorMessage(
                        "This document is missing a path."
                    );
                    return;
                }
                console.log(`Fixing ${editor.document.path}`);
                fixEslint(editor.document.path, () => {
                    console.log("fixed");
                });
            }
        }
    );

    nova.workspace.textEditors.forEach(watchEditor);

    nova.workspace.onDidAddTextEditor(watchEditor);

    function watchEditor(editor: TextEditor) {
        const document = editor.document;

        if (document.isRemote) {
            // TODO: what to do...
            // return;
        }

        if (
            !["javascript", "typescript", "tsx", "jsx"].includes(
                document.syntax ?? ""
            )
        ) {
            return;
        }

        linter.lintDocument(document);

        editor.onWillSave((editor) => {
            const shouldFix =
                nova.workspace.config.get(
                    "apexskier.eslint.config.fixOnSave",
                    "boolean"
                ) ??
                nova.config.get(
                    "apexskier.eslint.config.fixOnSave",
                    "boolean"
                ) ??
                false;
            if (shouldFix) {
                editor.onDidSave((editor) => {
                    if (!editor.document.path) {
                        nova.workspace.showErrorMessage(
                            "This document is missing a path."
                        );
                        return;
                    }
                    console.log(`Fixing ${editor.document.path}`);
                    fixEslint(editor.document.path, () => {
                        console.log("fixed");
                    });
                });
            }
            linter.lintDocument(editor.document);
        });
        editor.onDidStopChanging((editor) =>
            linter.lintDocument(editor.document)
        );
        document.onDidChangeSyntax((document) => linter.lintDocument(document));

        editor.onDidDestroy((destroyedEditor) => {
            const anotherEditor = nova.workspace.textEditors.find((editor) => {
                return editor.document.uri === destroyedEditor.document.uri;
            });

            if (!anotherEditor) {
                linter.removeIssues(destroyedEditor.document.uri);
            }
        });
    }
}
