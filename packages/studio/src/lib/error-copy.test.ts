import { afterEach, expect, it } from "vitest";
import { setAppLanguage } from "./app-language";
import { localizeKnownRuntimeMessage } from "./error-copy";

afterEach(() => setAppLanguage("zh"));

it("renders chapter review and patch results in Russian", () => {
  setAppLanguage("ru");
  expect(localizeKnownRuntimeMessage("Patched chapter 1.")).toBe("Внесены изменения в главу 1.");
  expect(localizeKnownRuntimeMessage("Reviewed chapter 1; 10 observation(s).")).toBe("Проверена глава 1; замечаний: 10.");
  setAppLanguage("en");
  expect(localizeKnownRuntimeMessage("Patched chapter 1.")).toBe("Patched chapter 1.");
});