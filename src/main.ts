import { Linter } from "./linter";
import { initialize } from "./process";
import { shouldFixOnSave } from "./shouldFixOnSave";
import { createSuggestionCommandHandler } from "./suggestionCommand";

const compositeDisposable = new CompositeDisposable();

async function asyncActivate() {
  await initialize();

  const linter = new Linter();
  compositeDisposable.add(linter);

  // eslint-disable-next-line no-unused-vars
  async function fix(workspace: Workspace, editor: TextEditor): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  async function fix(editor: TextEditor): Promise<void>;
  async function fix(
    workspaceOrEditor: Workspace | TextEditor,
    maybeEditor?: TextEditor
  ): Promise<void> {
    const editor = TextEditor.isTextEditor(workspaceOrEditor)
      ? workspaceOrEditor
      : maybeEditor!;

    await linter.fixEditor(editor);
    const p = editor.document.path;
    // this might not be technically necessary, but will run a fix in an external process, which
    // will help if linting hasn't processed before this is run
    if (p) {
      const d = editor.onDidSave(() => {
        d.dispose();
        linter.fixDocumentExternal(editor.document);
      });
      editor.save();
    }
  }

  compositeDisposable.add(
    nova.commands.register("apexskier.eslint.command.fix", fix)
  );
  compositeDisposable.add(
    nova.commands.register(
      "apexskier.eslint.command.suggestForCursor",
      createSuggestionCommandHandler(linter)
    )
  );
  compositeDisposable.add(
    nova.commands.register("apexskier.eslint.command.lintAllEditors", () => {
      nova.workspace.textEditors.forEach((editor) => {
        linter.lintDocument(editor.document);
      });
    })
  );

  compositeDisposable.add(nova.workspace.onDidAddTextEditor(watchEditor));

  function watchEditor(editor: TextEditor) {
    const document = editor.document;

    if (
      ![
        "javascript",
        "typescript",
        "tsx",
        "jsx",
        "vue",
        "html",
        "markdown",
      ].includes(document.syntax ?? "")
    ) {
      return;
    }

    linter.lintDocument(document);

    const editorDisposable = new CompositeDisposable();

    editorDisposable.add(
      editor.onWillSave(async (editor) => {
        if (shouldFixOnSave()) {
          await linter.fixEditor(editor);
        }
        linter.lintDocument(editor.document);
      })
    );
    editorDisposable.add(
      editor.onDidStopChanging((editor) => linter.lintDocument(editor.document))
    );
    editorDisposable.add(
      editor.onDidDestroy((destroyedEditor) => {
        const anotherEditor = nova.workspace.textEditors.find(
          (editor) => editor.document.uri === destroyedEditor.document.uri
        );

        if (!anotherEditor) {
          linter.removeIssues(destroyedEditor.document.uri);
        }
        editorDisposable.dispose();
      })
    );

    compositeDisposable.add(editorDisposable);

    compositeDisposable.add(
      document.onDidChangeSyntax((document) => linter.lintDocument(document))
    );
  }
}

export function activate() {
  console.log("activating...");
  if (nova.inDevMode()) {
    const notification = new NotificationRequest("activated");
    notification.body = "ESLint extension is loading";
    nova.notifications.add(notification);
  }
  return asyncActivate()
    .catch((err) => {
      console.error("Failed to activate");
      console.error(err);
      nova.workspace.showErrorMessage(err);
    })
    .then(() => {
      console.log("activated");
    });
}

export function deactivate() {
  compositeDisposable.dispose();
}
