const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanUrl, isSingleUrl } = require("../src/clean.js");

const cases = [
  // [name, input, expected]
  ["X share link", "https://x.com/Ihyvd014/status/2115497330082504960?a=jTJ6AphNO7lStihknsk&s=20", "https://x.com/Ihyvd014/status/2115497330082504960"],
  ["X share link with t", "https://x.com/user/status/123?s=46&t=AbCdEf", "https://x.com/user/status/123"],
  ["twitter.com status", "https://twitter.com/user/status/123?ref_src=twsrc%5Etfw", "https://twitter.com/user/status/123"],
  ["X search keeps q", "https://x.com/search?q=linkwash&src=typed_query", "https://x.com/search?q=linkwash&src=typed_query"],
  ["YouTube keeps v and t", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=abc123&feature=shared", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"],
  ["youtu.be share", "https://youtu.be/dQw4w9WgXcQ?si=Xyz_123", "https://youtu.be/dQw4w9WgXcQ"],
  ["YouTube playlist", "https://www.youtube.com/playlist?list=PL123&si=abc", "https://www.youtube.com/playlist?list=PL123"],
  ["Amazon product", "https://www.amazon.com/Some-Product-Name/dp/B08N5WRWNW/ref=sr_1_3?crid=2X&keywords=thing&qid=1700000000&sr=8-3", "https://www.amazon.com/dp/B08N5WRWNW"],
  ["Amazon gp/product", "https://www.amazon.co.uk/gp/product/B000000001?pf_rd_r=X&pd_rd_w=Y", "https://www.amazon.co.uk/dp/B000000001"],
  ["Amazon search keeps k", "https://www.amazon.com/s?k=usb+cable&crid=ABC&sprefix=usb&ref=nb_sb_noss", "https://www.amazon.com/s?k=usb+cable"],
  ["Spotify si", "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=1a2b3c", "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"],
  ["Instagram igsh", "https://www.instagram.com/reel/Cxyz/?igsh=MWQ1ZGUxMzBkMA==", "https://www.instagram.com/reel/Cxyz/"],
  ["utm on any site", "https://example.com/post?id=7&utm_source=newsletter&utm_medium=email", "https://example.com/post?id=7"],
  ["fbclid", "https://example.com/?fbclid=IwAR123", "https://example.com/"],
  ["gclid keeps page params", "https://shop.example.com/item?color=red&gclid=abc", "https://shop.example.com/item?color=red"],
  ["utm in fragment", "https://example.com/page#utm_source=x&utm_medium=y", "https://example.com/page"],
  ["keeps hash anchors", "https://example.com/docs?utm_source=x#install", "https://example.com/docs#install"],
  ["Reddit share", "https://www.reddit.com/r/test/comments/abc/title/?share_id=XYZ&utm_content=1&utm_medium=ios_app", "https://www.reddit.com/r/test/comments/abc/title/"],
  ["TikTok share", "https://www.tiktok.com/@user/video/123?is_from_webapp=1&sender_device=pc&_t=8abc&_r=1", "https://www.tiktok.com/@user/video/123"],
  ["LinkedIn post", "https://www.linkedin.com/posts/someone_activity-123?utm_source=share&utm_medium=member_desktop&rcm=ACoAA", "https://www.linkedin.com/posts/someone_activity-123"],
  ["Google search keeps q", "https://www.google.com/search?q=link+cleaner&oq=link+cl&gs_lcrp=EgZ&sourceid=chrome&ie=UTF-8", "https://www.google.com/search?q=link+cleaner"],
];

for (const [name, input, expected] of cases) {
  test(name, () => assert.equal(cleanUrl(input), expected));
}

test("leaves clean links exactly as they were", () => {
  for (const url of [
    "https://example.com/",
    "https://example.com/a?b=c",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://github.com/buildleansaas/linkwash",
    "https://maps.google.com/?q=Richmond",
  ]) {
    assert.equal(cleanUrl(url), url);
  }
});

// Links people need: found in review (PR #2). Each must survive exactly.
test("keeps params that pages need", () => {
  for (const url of [
    "https://medium.com/@user/my-story-abc123def456?sk=6a5c1b2d3e4f",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&lc=UgzABCDEF123",
    "https://www.youtube.com/@mkbhd/search?query=iphone",
    "https://www.youtube.com/embed/dQw4w9WgXcQ?start=30&autoplay=1",
    "https://www.amazon.com/gp/search?ie=UTF8&index=books&keywords=harry+potter",
    "https://example.com/track?trackingId=1Z999AA10123456784",
    "https://example.com/#pricing",
    "https://example.com/app#/route?utm_source=x",
    "https://bucket.s3.amazonaws.com/f.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc",
  ]) {
    assert.equal(cleanUrl(url), url);
  }
});

test("removing a tracker leaves every other byte alone", () => {
  assert.equal(cleanUrl("https://example.com/search?q=a%20b&utm_source=x"), "https://example.com/search?q=a%20b");
  assert.equal(cleanUrl("https://example.com/p?amp&utm_source=x"), "https://example.com/p?amp");
  assert.equal(cleanUrl("https://example.com/p?path=~user/a:b&utm_source=x"), "https://example.com/p?path=~user/a:b");
  assert.equal(cleanUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&lc=Ugz1&si=abc"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&lc=Ugz1");
  assert.equal(cleanUrl("https://www.amazon.com/gp/search?keywords=lamp&tag=foo-20"), "https://www.amazon.com/gp/search?keywords=lamp");
});

test("an anchor next to trackers in the fragment is left alone", () => {
  assert.equal(cleanUrl("https://example.com/#pricing&utm_source=x"), "https://example.com/#pricing&utm_source=x");
  assert.equal(cleanUrl("https://example.com/#section?utm_source=x"), "https://example.com/#section?utm_source=x");
  assert.equal(cleanUrl("https://example.com/p#utm_source=x&ref=7"), "https://example.com/p#ref=7");
});

test("ignores text that is not a single link", () => {
  for (const text of [
    "hello world",
    "see https://x.com/a/status/1?s=20 here",
    "https://a.com?utm_source=x https://b.com",
    "ftp://example.com/?utm_source=x",
    "",
  ]) {
    assert.equal(cleanUrl(text), text);
  }
  assert.equal(cleanUrl(undefined), undefined);
});

test("trims surrounding whitespace only when it cleans", () => {
  assert.equal(cleanUrl("  https://example.com/?fbclid=1\n"), "https://example.com/");
  assert.equal(cleanUrl("  https://example.com/ "), "  https://example.com/ ");
});

test("isSingleUrl", () => {
  assert.equal(isSingleUrl("https://x.com/a"), true);
  assert.equal(isSingleUrl(" http://x.com/a\n"), true);
  assert.equal(isSingleUrl("x.com/a"), false);
  assert.equal(isSingleUrl("two https://a.com"), false);
});
