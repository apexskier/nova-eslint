import * as path from "path";
import { getEslintConfig } from "./getEslintConfig";

(global as any).nova = Object.assign(nova, {
  config: { get: jest.fn() },
  workspace: { config: { get: jest.fn() }, showErrorMessage: jest.fn() },
  path: {
    isAbsolute: path.isAbsolute,
    join: path.join,
  },
  fs: {
    access: jest.fn(),
    R_OK: Symbol("R_OK"),
  },
});

describe("getEslintConfig", () => {
  beforeEach(() => {
    (nova.config.get as jest.Mock).mockReset();
    delete (nova.workspace as any).path;
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.workspace.showErrorMessage as jest.Mock).mockReset();
    (nova.fs.access as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => true);
  });

  afterEach(() => {
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintConfigPath",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(1);
    expect(nova.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintConfigPath",
      "string"
    );
  });

  test("default", () => {
    expect(getEslintConfig()).toBeUndefined();
  });

  test("configured for workspace relatively", () => {
    (nova.workspace as any).path = "/workspace";
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/abs/gl/b");
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "rel/ws/a"
    );
    expect(getEslintConfig()).toEqual("/workspace/rel/ws/a");
  });

  test("configured for workspace absolutely", () => {
    (nova.workspace as any).path = "/workspace";
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/abs/gl/b");
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "/abs/ws/a"
    );
    expect(getEslintConfig()).toEqual("/abs/ws/a");
  });

  test("configured globally", () => {
    (nova.workspace as any).path = "/workspace";
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/abs/gl/b");
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => undefined
    );
    expect(getEslintConfig()).toEqual("/abs/gl/b");
  });

  test("workspace relative paths not allowed without a workspace path", () => {
    (nova.config.get as jest.Mock).mockImplementationOnce(() => undefined);
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "rel"
    );
    expect(getEslintConfig()).toEqual(null);
    expect(nova.workspace.showErrorMessage).toBeCalledTimes(1);
  });

  test("checks readability", () => {
    (nova.fs.access as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => false);
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/global/path");
    expect(getEslintConfig()).toEqual(null);
    expect(nova.fs.access).toBeCalledTimes(1);
    expect(nova.fs.access).toHaveBeenNthCalledWith(
      1,
      "/global/path",
      nova.fs.R_OK
    );
  });
});
