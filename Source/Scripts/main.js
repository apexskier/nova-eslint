import { Linter } from "./linter";
import { fixEslint } from "./process";

export function activate() {
    console.log("activating...");

    const linter = new Linter();

    nova.commands.register("Mecham.ESLint.fix", (editor) => {
        if (editor.document.isDirty) {
            console.log("after saving");
            editor.onDidSave(fix);
            editor.save();
        } else {
            fix(editor);
        }

        function fix(editor) {
            console.log(`Fixing ${editor.document.path}`);
            fixEslint(editor.document.path, () => {
                console.log("fixed");
            });
        }
    });

    nova.workspace.textEditors.forEach(watchEditor);

    nova.workspace.onDidAddTextEditor(watchEditor);

    function watchEditor(editor) {
        const document = editor.document;

        if (document.isRemote) {
            // TODO: what to do...
            // return;
        }

        if (
            !["javascript", "typescript", "tsx", "jsx"].includes(
                document.syntax
            )
        ) {
            return;
        }

        linter.lintDocument(document);

        editor.onWillSave((editor) => {
            let shouldFix = false;
            let shouldFixWorkspace = nova.workspace.config.get(
                "Mecham.ESLint.saveOnFix",
                "boolean"
            );
            if (shouldFixWorkspace == null) {
                shouldFix = nova.config.get(
                    "Mecham.ESLint.saveOnFix",
                    "boolean"
                );
            } else {
                shouldFix = shouldFixWorkspace;
            }
            if (shouldFix) {
                editor.onDidSave((editor) => {
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
            let anotherEditor = nova.workspace.textEditors.find((editor) => {
                return editor.document.uri === destroyedEditor.document.uri;
            });

            if (!anotherEditor) {
                linter.removeIssues(destroyedEditor.document.uri);
            }
        });
    }
}
