import { Linter } from "./linter";
import { fixEslint } from "./process";

const compositeDisposable = new CompositeDisposable();

// eslint-disable-next-line no-unused-vars
function fix(workspace: Workspace, editor: TextEditor): void;
// eslint-disable-next-line no-unused-vars
function fix(editor: TextEditor): void;
function fix(
    workspaceOrEditor: Workspace | TextEditor,
    maybeEditor?: TextEditor
): void {
    const editor = TextEditor.isTextEditor(workspaceOrEditor)
        ? workspaceOrEditor
        : maybeEditor!;
    if (editor.document.isDirty) {
        const listener = editor.onDidSave(() => {
            listener.dispose();
            innerFix();
        });
        editor.save();
    } else {
        innerFix();
    }

    function innerFix() {
        if (!editor.document.path) {
            nova.workspace.showErrorMessage("This document is missing a path.");
            return;
        }
        console.log("Fixing", editor.document.path);
        fixEslint(editor.document.path);
    }
}

export function activate() {
    console.log("activating...");

    const linter = new Linter();

    compositeDisposable.add(
        nova.commands.register("apexskier.eslint.command.fix", fix)
    );

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
                        listener.dispose();
                        if (!editor.document.path) {
                            nova.workspace.showErrorMessage(
                                "This document is missing a path."
                            );
                            return;
                        }
                        nova.commands.invoke(
                            "apexskier.eslint.command.fix",
                            editor
                        );
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
                editorDisposable.dispose();
            })
        );

        compositeDisposable.add(editorDisposable);
    }

    console.log("activated");
}

export function deactivate() {
    compositeDisposable.dispose();
}
