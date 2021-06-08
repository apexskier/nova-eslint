import { shouldFixOnSave } from "./shouldFixOnSave";

(global as any).nova = Object.assign(nova, {
  config: { get: jest.fn() },
  workspace: { config: { get: jest.fn() } },
});

describe("shouldFixOnSave", () => {
  beforeEach(() => {
    (nova.config.get as jest.Mock).mockReset();
    (nova.workspace.config.get as jest.Mock).mockReset();
  });

  test("default", () => {
    expect(shouldFixOnSave()).toBeFalsy();
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(1);
    expect(nova.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "boolean"
    );
  });

  test("enabled for workspace", () => {
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "Enable"
    );
    expect(shouldFixOnSave()).toBeTruthy();
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "string"
    );
    expect(nova.config.get).not.toBeCalled();
  });

  test("disabled for workspace, enabled globally", () => {
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "Disable"
    );
    (nova.config.get as jest.Mock).mockImplementationOnce(() => true);
    expect(shouldFixOnSave()).toBeFalsy();
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(0);
  });

  test("enabled globally", () => {
    (nova.config.get as jest.Mock).mockImplementationOnce(() => true);
    (nova.config.get as jest.Mock).mockImplementationOnce(() => true);
    expect(shouldFixOnSave()).toBeTruthy();
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(1);
    expect(nova.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.fixOnSave",
      "boolean"
    );
  });
});
