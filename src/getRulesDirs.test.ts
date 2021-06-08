import * as path from "path";
import { getRulesDirs } from "./getRulesDirs";

(global as any).nova = Object.assign(nova, {
  config: { get: jest.fn() },
  workspace: { config: { get: jest.fn() }, showErrorMessage: jest.fn() },
  path: {
    isAbsolute: path.isAbsolute,
    join: path.join,
  },
});

describe("getRulesDirs", () => {
  beforeEach(() => {
    (nova.config.get as jest.Mock).mockReset();
    delete (nova.workspace as any).path;
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.workspace.showErrorMessage as jest.Mock).mockReset();
  });

  afterEach(() => {
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintRulesDirs",
      "array"
    );
    expect(nova.config.get).toBeCalledTimes(1);
    expect(nova.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintRulesDirs",
      "array"
    );
  });

  test("default", () => {
    expect(getRulesDirs()).toEqual([]);
  });

  test("configured", () => {
    (nova.workspace as any).path = "/workspace";
    (nova.config.get as jest.Mock).mockImplementationOnce(() => ["/abs/gl/b"]);
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(() => [
      "rel/ws/a",
      "/abs/ws/b",
      "   ",
    ]);
    expect(getRulesDirs()).toEqual([
      '"/abs/gl/b"',
      '"/workspace/rel/ws/a"',
      '"/abs/ws/b"',
    ]);
  });

  test("workspace relative paths not allowed without a workspace path", () => {
    (nova.config.get as jest.Mock).mockImplementationOnce(() => []);
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(() => [
      "rel",
    ]);
    expect(getRulesDirs()).toEqual(null);
    expect(nova.workspace.showErrorMessage).toBeCalledTimes(1);
  });
});
