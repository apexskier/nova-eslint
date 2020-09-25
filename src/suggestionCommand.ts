import type { Linter } from "./linter";
import type { Rule } from "eslint";

export async function showChoicePalette<T>(
  choices: T[],
  // eslint-disable-next-line no-unused-vars
  choiceToString: (choice: T) => string,
  options?: { placeholder?: string }
) {
  const index = await new Promise<number | null>((resolve) =>
    nova.workspace.showChoicePalette(
      choices.map(choiceToString),
      options,
      (_, index) => {
        resolve(index);
      }
    )
  );
  if (index == null) {
    return null;
  }
  return choices[index];
}

export function createSuggestionCommandHandler(linter: Linter) {
  return async (editor: TextEditor) => {
    const message = linter.getSuggestions(editor);
    if (!message?.fix && !message?.suggestions?.length) {
      nova.workspace.showWarningMessage("No suggestions found");
      return;
    }
    const choices: Array<{ title: string; fix: Rule.Fix }> = [];
    if (message.fix) {
      choices.push({ title: "Fix", fix: message.fix });
    }
    if (message.suggestions) {
      choices.push(
        ...message.suggestions.map((suggestion) => ({
          title: suggestion.desc,
          fix: suggestion.fix,
        }))
      );
    }
    const choice = await showChoicePalette(choices, ({ title }) => title, {
      placeholder: message.message,
    });
    if (choice) {
      editor.edit((edit) => {
        edit.replace(
          new Range(choice.fix.range[0], choice.fix.range[1]),
          choice.fix.text
        );
      });
    }
  };
}
