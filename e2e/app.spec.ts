import { expect, test } from "@playwright/test";

test("loads home page without getting stuck on hydration", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "YT Binger" })).toBeVisible();
  await expect(page.getByPlaceholder(/Paste channel URL/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Load channel" })).toBeVisible();

  await expect(page.getByText(/^Loading…$/)).toHaveCount(0);
});

test("loads a channel and shows videos", async ({ page }) => {
  await page.goto("/");

  await page
    .getByPlaceholder(/Paste channel URL/i)
    .fill("https://www.youtube.com/@3blue1brown");
  await page.getByRole("button", { name: "Load channel" }).click();

  await expect(page.getByRole("heading", { name: "3Blue1Brown" })).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByText(/Fetching video list/i)).toBeVisible();
  await expect(page.getByText(/Fetching video list/i)).toBeHidden({
    timeout: 60_000,
  });

  await expect(page.getByText(/\d+ \/ \d+ watched/)).toBeVisible();
  await expect(page.getByText("Next to watch")).toBeVisible();
  await expect(page.getByRole("link", { name: /Watch on YouTube/i }).first()).toBeVisible();
});

test("mark watched advances next recommendation", async ({ page }) => {
  await page.goto("/");

  await page
    .getByPlaceholder(/Paste channel URL/i)
    .fill("https://www.youtube.com/@3blue1brown");
  await page.getByRole("button", { name: "Load channel" }).click();

  await expect(page.getByText(/\d+ \/ \d+ watched/)).toBeVisible({
    timeout: 60_000,
  });

  const nextCard = page.locator("section").filter({ hasText: "Next to watch" });
  const firstNextTitle = await nextCard.locator("h2").innerText();

  await page.getByRole("button", { name: "Mark watched" }).first().click();

  await expect(async () => {
    const updatedTitle = await nextCard.locator("h2").innerText();
    expect(updatedTitle).not.toBe(firstNextTitle);
  }).toPass({ timeout: 5_000 });
});
