import crypto from "crypto";
import { createUserOnSirplay, updateUserOnSirplay } from "../services/sirplayUsers";

function print(obj: any) {
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  // Utente finto per testare outbound (non scrive su DB)
  const externalUserId = (process.env.SIRPLAY_SMOKE_EXTERNAL_USER_ID || "").trim();
  const localId = `smoke-${crypto.randomUUID().slice(0, 8)}`;

  const testUser = {
    id: localId,
    externalUserId: externalUserId || localId,
    username: "smoke_user",
    email: "smoke.user@example.com",
    firstName: "Smoke",
    lastName: "Test",
    dob: "1990-01-01",
    country: "IT",
    phoneNumber: "+390000000000",
  };

  console.log("== Sirplay Outbound Smoke ==");
  console.log("User:", { id: testUser.id, externalUserId: testUser.externalUserId });

  console.log("\n-- createUserOnSirplay --");
  const created = await createUserOnSirplay(testUser);
  print(created);

  console.log("\n-- updateUserOnSirplay --");
  const updated = await updateUserOnSirplay({
    ...testUser,
    lastName: "Test2",
  });
  print(updated);

  // Criterio “pass” pragmatico pre-call:
  // - se config manca => deve fallire chiaramente
  // - se Sirplay risponde 401/404 => ok (finché non danno credenziali/path reali)
  // - se 200/201 => perfetto
  const acceptableStatuses = new Set([200, 201, 204, 401, 404]);
  const okCreate = created.ok || acceptableStatuses.has(created.status);
  const okUpdate = updated.ok || acceptableStatuses.has(updated.status);

  if (okCreate && okUpdate) {
    console.log("\nRESULT: OK (within expected pre-call statuses)");
    process.exit(0);
  }

  console.error("\nRESULT: FAIL");
  process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e?.message || e);
  process.exit(1);
});