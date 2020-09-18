import { Linter } from "./linter";
import { fixEslint } from "./process";

const compositeDisposable = new CompositeDisposable();

export function activate() {
    console.log("activating...");

    const linter = new Linter();

    compositeDisposable.add(
        nova.commands.register(
            "apexskier.eslint.command.fix",
            (editor: TextEditor) => {
                if (editor.document.isDirty) {
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
                    fixEslint(editor.document.path);
                }
            }
        )
    );

    nova.workspace.textEditors.forEach(watchEditor);
    compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));

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

        const editorDisposable = new CompositeDisposable();

        editorDisposable.add(
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
                    const listener = editor.onDidSave((editor) => {
                        if (!editor.document.path) {
                            nova.workspace.showErrorMessage(
                                "This document is missing a path."
                            );
                            return;
                        }
                        console.log(`Fixing ${editor.document.path}`);
                        fixEslint(editor.document.path);
                        listener.dispose();
                    });
                }
                linter.lintDocument(editor.document);
            })
        );
        editorDisposable.add(
            editor.onDidStopChanging((editor) =>
                linter.lintDocument(editor.document)
            )
        );
        editorDisposable.add(
            document.onDidChangeSyntax((document) =>
                linter.lintDocument(document)
            )
        );

        editorDisposable.add(
            editor.onDidDestroy((destroyedEditor) => {
                const anotherEditor = nova.workspace.textEditors.find(
                    (editor) =>
                        editor.document.uri === destroyedEditor.document.uri
                );

                if (!anotherEditor) {
                    linter.removeIssues(destroyedEditor.document.uri);
                }
            })
        );

        compositeDisposable.add(editorDisposable);
    }

    console.log("activated");
}

export function deactivate() {
    compositeDisposable.dispose();
}
