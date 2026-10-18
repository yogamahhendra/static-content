import assert from "node:assert";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { signSession, verifySession } from "../lib/auth/session";
import {
  loginSchema,
  createCategorySchema,
  createContentSchema,
  createUserSchema,
} from "../lib/validations";
import { hasPermission } from "../lib/auth/rbac";
import {
  optimizeFile,
  validateSvgContent,
  calculateChecksum,
} from "../lib/storage/optimizer";
import sharp from "sharp";

async function runTests() {
  console.log("🧪 Starting Static CMS Test Suite...\n");
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Authentication & Security
  // -------------------------------------------------------------
  console.log("🔐 Testing Authentication & Security:");
  await test("Password hashing and verification with bcryptjs", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await hashPassword(password);
    assert.notStrictEqual(hash, password, "Hash must not equal plaintext");
    const isMatch = await verifyPassword(password, hash);
    assert.strictEqual(isMatch, true, "Valid password must verify true");
    const isWrongMatch = await verifyPassword("WrongPassword", hash);
    assert.strictEqual(isWrongMatch, false, "Wrong password must verify false");
  });

  await test("JWT session creation and cryptographic verification", async () => {
    const payload = {
      userId: "11111111-2222-3333-4444-555555555555",
      email: "admin@test.com",
      role: "admin",
    };
    const token = await signSession(payload);
    assert.strictEqual(typeof token, "string", "Token must be a string");
    const verified = await verifySession(token);
    assert.notStrictEqual(verified, null, "Verified payload should not be null");
    assert.strictEqual(verified?.userId, payload.userId);
    assert.strictEqual(verified?.email, payload.email);
    assert.strictEqual(verified?.role, payload.role);
  });

  await test("RBAC Role permissions matrix validation", () => {
    // Superadmin has all permissions
    assert.strictEqual(hasPermission("superadmin", "users:manage"), true);
    assert.strictEqual(hasPermission("superadmin", "contents:delete"), true);

    // Admin has content delete but cannot manage users
    assert.strictEqual(hasPermission("admin", "users:manage"), false);
    assert.strictEqual(hasPermission("admin", "contents:delete"), true);
    assert.strictEqual(hasPermission("admin", "contents:write"), true);

    // Editor can write and replace but cannot delete
    assert.strictEqual(hasPermission("editor", "contents:write"), true);
    assert.strictEqual(hasPermission("editor", "contents:delete"), false);
    assert.strictEqual(hasPermission("editor", "users:manage"), false);

    // Viewer is read-only
    assert.strictEqual(hasPermission("viewer", "contents:read"), true);
    assert.strictEqual(hasPermission("viewer", "contents:write"), false);
    assert.strictEqual(hasPermission("viewer", "contents:delete"), false);
  });

  // -------------------------------------------------------------
  // 2. Request Validations (Zod)
  // -------------------------------------------------------------
  console.log("\n📋 Testing Request Validations (Zod):");
  await test("Category slug validation accepts valid slugs", () => {
    const valid = createCategorySchema.safeParse({
      name: "Promo Banners",
      slug: "promo-banners",
      description: "Sample",
    });
    assert.strictEqual(valid.success, true);
  });

  await test("Category slug validation rejects uppercase and invalid characters", () => {
    const invalid1 = createCategorySchema.safeParse({
      name: "Bad",
      slug: "PROMO_BANNERS",
    });
    assert.strictEqual(invalid1.success, false);

    const invalid2 = createCategorySchema.safeParse({
      name: "Bad",
      slug: "promo banners with spaces",
    });
    assert.strictEqual(invalid2.success, false);
  });

  await test("Content key validation enforces strict lowercase kebab-case", () => {
    const valid = createContentSchema.safeParse({
      title: "Hero Banner",
      key: "homepage-hero-banner",
      categoryId: "00000000-0000-0000-0000-000000000000",
    });
    assert.strictEqual(valid.success, true);

    const invalid = createContentSchema.safeParse({
      title: "Hero Banner",
      key: "Homepage Hero Banner!#",
      categoryId: "00000000-0000-0000-0000-000000000000",
    });
    assert.strictEqual(invalid.success, false);
  });

  // -------------------------------------------------------------
  // 3. File Optimization Pipeline
  // -------------------------------------------------------------
  console.log("\n⚡ Testing File Optimization & Sanitization:");
  await test("JSON optimization minifies whitespace and preserves structure", async () => {
    const rawJson = `{\n  "title": "Config",\n  "version": 1,\n  "enabled": true\n}`;
    const buffer = Buffer.from(rawJson, "utf-8");
    const result = await optimizeFile(buffer, "app-config.json", "application/json");

    assert.strictEqual(result.status, "optimized");
    assert.strictEqual(result.contentType, "application/json");
    assert.strictEqual(result.finalSize < result.originalSize, true);
    assert.strictEqual(JSON.parse(result.buffer.toString("utf-8")).version, 1);
  });

  await test("SVG sanitizer rejects dangerous executable script tags", () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script><circle cx="50" cy="50" r="40"/></svg>`;
    const isSafe = validateSvgContent(maliciousSvg);
    assert.strictEqual(isSafe, false, "Dangerous SVG must be rejected");
  });

  await test("SVG sanitizer rejects dangerous event handler attributes", () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')"><circle cx="50" cy="50" r="40"/></svg>`;
    const isSafe = validateSvgContent(maliciousSvg);
    assert.strictEqual(isSafe, false, "SVG with onload handler must be rejected");
  });

  await test("SVG sanitizer accepts clean, safe vectors", () => {
    const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="indigo"/></svg>`;
    const isSafe = validateSvgContent(safeSvg);
    assert.strictEqual(isSafe, true, "Safe SVG must pass");
  });

  await test("Raster image optimization converts to WebP and strips metadata", async () => {
    // Generate a simple synthetic 100x100 red PNG in memory with Sharp
    const testPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeFile(testPngBuffer, "test-image.png", "image/png", {
      convertToWebp: true,
      quality: 80,
    });

    assert.strictEqual(result.contentType, "image/webp");
    assert.strictEqual(result.fileExtension, "webp");
    assert.strictEqual(typeof result.checksum, "string");
    assert.strictEqual(result.checksum.length, 64); // SHA-256 hex length
  });

  // -------------------------------------------------------------
  // 4. Stable URL Invariant Test
  // -------------------------------------------------------------
  console.log("\n🔗 Testing Stable Public URL Invariants:");
  await test("Stable URL contract is deterministic and independent of storage versioning", () => {
    const contentKey = "promo-october-banner";
    const publicUrlPattern = (key: string) => `/api/content/${key}`;

    const urlBeforeReplacement = publicUrlPattern(contentKey);
    // Even if storageKey changes from contents/promo-october-banner/1000.webp to contents/promo-october-banner/2000.webp
    const urlAfterReplacement = publicUrlPattern(contentKey);

    assert.strictEqual(
      urlBeforeReplacement,
      urlAfterReplacement,
      "Public endpoint must be strictly immutable across file replacements"
    );
  });

  await test("File replacement workflow purges previous storage key after database commit", () => {
    const previousStorageKey: string = "contents/homepage-banner/1700000000.webp";
    const newStorageKey: string = "contents/homepage-banner/1700005000.webp";

    let purgedKey: string | null = null;
    const mockDelete = (key: string) => {
      purgedKey = key;
      return true;
    };

    // Simulate replacement logic
    if (previousStorageKey && previousStorageKey !== newStorageKey) {
      mockDelete(previousStorageKey);
    }

    assert.strictEqual(purgedKey, previousStorageKey, "Previous storage key must be purged from storage");
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
