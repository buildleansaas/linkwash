const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("../manifest.json");

// Chrome Web Store rejects the upload above these limits.
test("manifest fits Chrome Web Store limits", () => {
  assert.ok(manifest.description.length <= 132, `description is ${manifest.description.length} chars`);
  assert.ok(manifest.name.length <= 75, `name is ${manifest.name.length} chars`);
  assert.ok(manifest.short_name.length <= 12, `short_name is ${manifest.short_name.length} chars`);
});
