import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL is not set in environment or .env file.");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "ChangeMeStrongPassword123!";

  console.log(`🌱 Seeding initial admin user (${adminEmail})...`);

  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existingUsers.length > 0) {
    await db
      .update(schema.users)
      .set({ role: "superadmin" })
      .where(eq(schema.users.email, adminEmail));
    console.log(`ℹ️ Admin user (${adminEmail}) already exists. Role confirmed as 'superadmin'.`);
  } else {
    const passwordHash = await hashPassword(adminPassword);
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash,
      role: "superadmin",
    });
    console.log(`✅ Superadmin user (${adminEmail}) created successfully!`);
  }

  console.log(`🌱 Checking initial categories...`);
  const initialCategories = [
    { name: "Banners & Images", slug: "banners", description: "Public banners and homepage promotional media" },
    { name: "Documents", slug: "documents", description: "Public PDF documents, terms, and guidelines" },
    { name: "Configuration", slug: "configs", description: "JSON configurations and application settings" },
  ];

  for (const cat of initialCategories) {
    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, cat.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.categories).values(cat);
      console.log(`  + Category added: ${cat.name} (slug: ${cat.slug})`);
    } else {
      console.log(`  = Category already exists: ${cat.name} (slug: ${cat.slug})`);
    }
  }

  console.log("✨ Seeding completed successfully!");
}

runSeed().catch((err) => {
  console.error("❌ Seed failed with error:", err);
  process.exit(1);
});
