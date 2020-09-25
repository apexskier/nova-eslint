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

type FixChoiceType = { fix: Rule.Fix } | { fixAll: true };
function isFixAll(x: FixChoiceType): x is { fixAll: true } {
  return !!(x as { fixAll: true }).fixAll;
}

export function createSuggestionCommandHandler(linter: Linter) {
  return async (editor: TextEditor) => {
    const choices: Array<
      { title: string } & ({ fix: Rule.Fix } | { fixAll: true })
    > = [];
    const message = linter.getMessageAtSelection(editor);
    if (message) {
      if (message.fix) {
        choices.push({
          title: `Fix this ${message.ruleId} problem`,
          fix: message.fix,
        });
      }
      if (message.suggestions) {
        choices.push(
          ...message.suggestions.map((suggestion) => ({
            title: suggestion.desc,
            fix: suggestion.fix,
          }))
        );
      }
    }
    choices.push({ title: "Fix all auto-fixable problems", fixAll: true });
    const choice = await showChoicePalette(choices, ({ title }) => title, {
      placeholder: message?.message,
    });
    if (!choice) {
      return;
    }
    if (isFixAll(choice)) {
      const messages = linter.getAllMessages(editor).filter((m) => m.fix);
      editor.edit((edit) => {
        for (const m of messages.reverse()) {
          const fix = m.fix!; // filter above ensures fix is available
          edit.replace(new Range(fix.range[0], fix.range[1]), fix.text);
        }
      });
      nova.commands.invoke("apexskier.eslint.command.fix", editor);
    } else {
      const { fix } = choice;
      editor.edit((edit) => {
        edit.replace(new Range(fix.range[0], fix.range[1]), fix.text);
      });
    }
  };
}
