import { describe, it, expect, vi } from "vitest";

const app = { use: vi.fn().mockReturnThis(), mount: vi.fn() };

vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal()),
  createApp: vi.fn(() => app),
}));
vi.mock("./App.vue", () => ({ default: { render: () => null } }));
vi.mock("./index.css", () => ({}));

describe("main", () => {
  it("creates the app with pinia and router and mounts it", async () => {
    const { createApp } = await import("vue");
    const router = (await import("./router.js")).default;
    await import("./main.js");

    expect(createApp).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledTimes(2);
    expect(app.use).toHaveBeenCalledWith(router);
    expect(app.mount).toHaveBeenCalledWith("#app");
  });
});
