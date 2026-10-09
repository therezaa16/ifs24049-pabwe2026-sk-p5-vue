import { describe, it, expect } from "vitest";
import { routes } from "./router";

function collect(list) {
  return list.flatMap((route) => [route, ...collect(route.children ?? [])]);
}

describe("router", () => {
  it("lazy loads every route component", async () => {
    const loaders = collect(routes)
      .map((route) => route.component)
      .filter(Boolean);
    expect(loaders).toHaveLength(9);

    const modules = await Promise.all(loaders.map((load) => load()));
    modules.forEach((module) => expect(module.default).toBeDefined());
  });
});
