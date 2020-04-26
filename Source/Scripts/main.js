import { Linter } from "./linter";

export function activate() {
  console.log("activating...");
  console.log(nova.workspace.path);

  const linter = new Linter();

  for (const editor of nova.workspace.textEditors) {
    console.log(editor.document.uri);
  }

  nova.workspace.textEditors.forEach(watchEditor);

  nova.workspace.onDidAddTextEditor(watchEditor);

  function watchEditor(editor) {
    const document = editor.document;

    console.log(document.uri);

    if (document.isRemote) {
      return;
    }
    if (!["javascript", "typescript", "tsx", "jsx"].includes(document.syntax)) {
      return;
    }

    linter.lintDocument(document);

    editor.onWillSave((editor) => linter.lintDocument(editor.document));
    editor.onDidStopChanging((editor) => linter.lintDocument(editor.document));
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
