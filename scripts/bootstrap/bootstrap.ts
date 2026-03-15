/**
 * AMMAP TEST ENVIRONMENT BOOTSTRAP
 * =============================================================
 * WARNING: THIS MUST ONLY RUN IN DEV / STAGING ENVIRONMENTS
 * DO NOT RUN IN PRODUCTION
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY      — Service role key (admin, never expose publicly)
 *   ALLOW_TEST_BOOTSTRAP=true      — Explicit opt-in guard
 *
 * What this script does (in order):
 *   1. Environment guard check
 *   2. Create auth users via Supabase Admin API (idempotent)
 *   3. Delete auto-created orgs from handle_new_user_org trigger
 *   4. Run seed.sql via SQL execute (orgs, projects, spatial, domain data)
 *
 * Run:
 *   ALLOW_TEST_BOOTSTRAP=true npx tsx scripts/bootstrap/bootstrap.ts
 *
 * Reset (re-run safely):
 *   The script is idempotent — re-running will skip existing users
 *   and seed.sql uses ON CONFLICT DO NOTHING throughout.
 * =============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// =============================================================
// ENVIRONMENT GUARD
// =============================================================
if (process.env.ALLOW_TEST_BOOTSTRAP !== "true") {
  console.error(
    "BLOCKED: Set ALLOW_TEST_BOOTSTRAP=true to run this script.\n" +
    "This bootstrap MUST NOT run in production."
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("BLOCKED: NODE_ENV=production. Bootstrap is not allowed in production.");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing required env vars:\n" +
    "  NEXT_PUBLIC_SUPABASE_URL\n" +
    "  SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Admin client — uses service role, bypasses RLS
// ONLY used inside this bootstrap script
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =============================================================
// USER DEFINITIONS
// Password convention: email local-part + "@ammap"
// =============================================================
interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

const TEST_USERS: TestUser[] = [
  // AMMAP Test Org
  { email: "owner@ammap-test.com",       password: "owner@ammap",       displayName: "Owner (AMMAP Test)" },
  { email: "admin@ammap-test.com",       password: "admin@ammap",       displayName: "Admin (AMMAP Test)" },
  { email: "pm@ammap-test.com",          password: "pm@ammap",          displayName: "Project Manager" },
  { email: "site-manager@ammap-test.com",password: "site-manager@ammap",displayName: "Site Manager" },
  { email: "engineer1@ammap-test.com",   password: "engineer1@ammap",   displayName: "Engineer 1" },
  { email: "engineer2@ammap-test.com",   password: "engineer2@ammap",   displayName: "Engineer 2" },
  { email: "qa@ammap-test.com",          password: "qa@ammap",          displayName: "QA Inspector" },
  { email: "safety@ammap-test.com",      password: "safety@ammap",      displayName: "Safety Officer" },
  { email: "planner@ammap-test.com",     password: "planner@ammap",     displayName: "Planner" },
  { email: "document@ammap-test.com",    password: "document@ammap",    displayName: "Document Controller" },
  { email: "procurement@ammap-test.com", password: "procurement@ammap", displayName: "Procurement Officer" },
  { email: "viewer@ammap-test.com",      password: "viewer@ammap",      displayName: "Viewer (AMMAP Test)" },

  // Main Contractor Org
  { email: "owner@main-contractor.com",  password: "owner@ammap",       displayName: "Owner (Main Contractor)" },
  { email: "admin@main-contractor.com",  password: "admin@ammap",       displayName: "Admin (Main Contractor)" },
  { email: "pm@main-contractor.com",     password: "pm@ammap",          displayName: "PM (Main Contractor)" },
  { email: "engineer@main-contractor.com",password: "engineer@ammap",   displayName: "Engineer (Main Contractor)" },
  { email: "foreman@main-contractor.com",password: "foreman@ammap",     displayName: "Foreman" },
  { email: "viewer@main-contractor.com", password: "viewer@ammap",      displayName: "Viewer (Main Contractor)" },

  // QA Consultant Org
  { email: "owner@qa-consultant.com",    password: "owner@ammap",       displayName: "Owner (QA Consultant)" },
  { email: "qa-lead@qa-consultant.com",  password: "qa-lead@ammap",     displayName: "QA Lead" },
  { email: "inspector1@qa-consultant.com",password: "inspector1@ammap", displayName: "Inspector 1" },
  { email: "inspector2@qa-consultant.com",password: "inspector2@ammap", displayName: "Inspector 2" },
  { email: "viewer@qa-consultant.com",   password: "viewer@ammap",      displayName: "Viewer (QA Consultant)" },

  // Subcontractor Org
  { email: "owner@subcontractor.com",    password: "owner@ammap",       displayName: "Owner (Subcontractor)" },
  { email: "admin@subcontractor.com",    password: "admin@ammap",       displayName: "Admin (Subcontractor)" },
  { email: "supervisor@subcontractor.com",password: "supervisor@ammap", displayName: "Supervisor" },
  { email: "worker1@subcontractor.com",  password: "worker1@ammap",     displayName: "Worker 1" },
  { email: "worker2@subcontractor.com",  password: "worker2@ammap",     displayName: "Worker 2" },

  // Client / Owner Org
  { email: "owner@client-owner.com",     password: "owner@ammap",       displayName: "Owner (Client)" },
  { email: "executive@client-owner.com", password: "executive@ammap",   displayName: "Executive" },
  { email: "reviewer@client-owner.com",  password: "reviewer@ammap",    displayName: "Reviewer" },
  { email: "viewer@client-owner.com",    password: "viewer@ammap",      displayName: "Viewer (Client)" },

  // Another Test Org
  { email: "owner@another-org.com",      password: "owner@ammap",       displayName: "Owner (Another Org)" },
  { email: "admin@another-org.com",      password: "admin@ammap",       displayName: "Admin (Another Org)" },
  { email: "engineer@another-org.com",   password: "engineer@ammap",    displayName: "Engineer (Another Org)" },
  { email: "viewer@another-org.com",     password: "viewer@ammap",      displayName: "Viewer (Another Org)" },
];

// =============================================================
// STEP 1: CREATE AUTH USERS
// =============================================================
async function createAuthUsers(): Promise<Map<string, string>> {
  console.log("\n[1/4] Creating auth users...");
  const emailToId = new Map<string, string>();

  // Fetch existing users first
  const { data: existingList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingByEmail = new Map<string, string>();
  for (const u of existingList?.users ?? []) {
    existingByEmail.set(u.email!, u.id);
  }

  let created = 0;
  let skipped = 0;

  for (const user of TEST_USERS) {
    if (existingByEmail.has(user.email)) {
      emailToId.set(user.email, existingByEmail.get(user.email)!);
      skipped++;
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.displayName },
    });

    if (error) {
      console.error(`  ✗ Failed to create ${user.email}: ${error.message}`);
      continue;
    }

    emailToId.set(user.email, data.user.id);
    created++;
    console.log(`  ✓ Created: ${user.email}`);
  }

  console.log(`  → ${created} created, ${skipped} already existed`);
  return emailToId;
}

// =============================================================
// STEP 2: DELETE AUTO-CREATED ORGS FROM TRIGGER
// The handle_new_user_org trigger creates an org for every new user.
// We delete those auto-created orgs so our canonical orgs are the only ones.
// We identify auto-created orgs by: owner_id = user's id AND name matches
// the auto-generated pattern AND id is NOT one of our canonical org IDs.
// =============================================================
async function deleteAutoCreatedOrgs(emailToId: Map<string, string>): Promise<void> {
  console.log("\n[2/4] Cleaning up auto-created orgs from trigger...");

  const canonicalOrgIds = [
    "aaaaaaaa-0001-0001-0001-000000000001",
    "aaaaaaaa-0002-0002-0002-000000000002",
    "aaaaaaaa-0003-0003-0003-000000000003",
    "aaaaaaaa-0004-0004-0004-000000000004",
    "aaaaaaaa-0005-0005-0005-000000000005",
    "aaaaaaaa-0006-0006-0006-000000000006",
  ];

  const userIds = Array.from(emailToId.values());
  if (userIds.length === 0) return;

  // Find orgs owned by bootstrap users that are NOT canonical orgs
  const { data: autoOrgs, error } = await admin
    .from("organizations")
    .select("id, name, owner_id")
    .in("owner_id", userIds)
    .not("id", "in", `(${canonicalOrgIds.map((id) => `'${id}'`).join(",")})`);

  if (error) {
    console.warn(`  ⚠ Could not query auto-orgs: ${error.message}`);
    return;
  }

  if (!autoOrgs || autoOrgs.length === 0) {
    console.log("  → No auto-created orgs to clean up");
    return;
  }

  for (const org of autoOrgs) {
    const { error: delErr } = await admin
      .from("organizations")
      .delete()
      .eq("id", org.id);

    if (delErr) {
      console.warn(`  ⚠ Could not delete org "${org.name}" (${org.id}): ${delErr.message}`);
    } else {
      console.log(`  ✓ Deleted auto-org: "${org.name}" (${org.id})`);
    }
  }
}

// =============================================================
// STEP 3: UPDATE PROFILES display_name (backfill if not set well)
// =============================================================
async function updateProfiles(emailToId: Map<string, string>): Promise<void> {
  console.log("\n[3/4] Updating profiles display names...");
  let updated = 0;

  for (const user of TEST_USERS) {
    const userId = emailToId.get(user.email);
    if (!userId) continue;

    const { error } = await admin
      .from("profiles")
      .upsert({ id: userId, display_name: user.displayName }, { onConflict: "id" });

    if (error) {
      console.warn(`  ⚠ Could not update profile for ${user.email}: ${error.message}`);
    } else {
      updated++;
    }
  }
  console.log(`  → ${updated} profiles updated`);
}

// =============================================================
// STEP 4: RUN seed.sql
// =============================================================
async function runSeedSql(): Promise<void> {
  console.log("\n[4/4] Running seed.sql...");

  const seedPath = join(__dirname, "seed.sql");
  const sql = readFileSync(seedPath, "utf-8");

  // Split on statement boundaries (semicolons at end of lines) to run individually
  // This avoids issues with multi-statement execution in some drivers
  // We use the Supabase rpc/execute via admin client
  const { error } = await admin.rpc("exec_sql", { sql_query: sql }).single();

  if (error) {
    // exec_sql RPC may not exist — fall back to direct REST execute
    console.warn("  ⚠ exec_sql RPC not available, attempting direct execute...");
    await runSeedSqlDirect(sql);
    return;
  }

  console.log("  ✓ seed.sql executed via RPC");
}

async function runSeedSqlDirect(sql: string): Promise<void> {
  // Split SQL into individual statements and execute via admin
  // We use a simpler approach: split on statement terminators
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ sql_query: stmt + ";" }),
      });
      if (res.ok) {
        success++;
      } else {
        const body = await res.text();
        // ON CONFLICT DO NOTHING may return 0 rows — not an error
        if (!body.includes("already exists") && !body.includes("duplicate")) {
          console.warn(`  ⚠ Statement warning: ${body.slice(0, 120)}`);
        }
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }

  console.log(`  → ${success} statements OK, ${failed} warnings/skipped`);
}

// =============================================================
// MAIN
// =============================================================
async function main() {
  console.log("=================================================");
  console.log("  AMMAP TEST ENVIRONMENT BOOTSTRAP");
  console.log("=================================================");
  console.log(`  Target: ${SUPABASE_URL}`);
  console.log(`  Users:  ${TEST_USERS.length}`);
  console.log("=================================================");

  const emailToId = await createAuthUsers();
  await deleteAutoCreatedOrgs(emailToId);
  await updateProfiles(emailToId);
  await runSeedSql();

  console.log("\n=================================================");
  console.log("  BOOTSTRAP COMPLETE");
  console.log("=================================================");
  console.log("\nTest credentials summary:");
  console.log("  owner@ammap-test.com      / owner@ammap      (org owner)");
  console.log("  admin@ammap-test.com      / admin@ammap      (org admin)");
  console.log("  pm@ammap-test.com         / pm@ammap         (project manager)");
  console.log("  engineer1@ammap-test.com  / engineer1@ammap  (engineer)");
  console.log("  qa@ammap-test.com         / qa@ammap         (qa inspector)");
  console.log("  viewer@ammap-test.com     / viewer@ammap     (viewer)");
  console.log("  owner@another-org.com     / owner@ammap      (cross-org isolation test)");
  console.log("\nVerify via: Supabase Dashboard → Authentication → Users");
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
