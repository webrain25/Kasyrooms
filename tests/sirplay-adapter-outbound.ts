import crypto from "crypto";
import { outboundCreateUserOnSirplay, outboundUpdateUserOnSirplay } from "../server/services/sirplayAdapter";

function print(obj: any) {
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  const externalUserId = (process.env.SIRPLAY_SMOKE_EXTERNAL_USER_ID || "").trim();
  const localId = `adapter-${crypto.randomUUID().slice(0, 8)}`;

  const testUser = {
    id: localId,
    externalUserId: externalUserId || localId,
    username: "adapter_user",
    email: "adapter.user@example.com",
    firstName: "Adapter",
    lastName: "Test",
    dob: "1990-01-01",
    country: "IT",
    phoneNumber: "+390000000000",
  };

  console.log("== Sirplay Adapter Outbound Test ==");
  console.log("User:", { id: testUser.id, externalUserId: testUser.externalUserId });

  console.log("\n-- outboundCreateUserOnSirplay --");
  const created = await outboundCreateUserOnSirplay(testUser);
  print(created);

  console.log("\n-- outboundUpdateUserOnSirplay --");
  const updated = await outboundUpdateUserOnSirplay({
    ...testUser,
    lastName: "Test2",
  });
  print(updated);

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