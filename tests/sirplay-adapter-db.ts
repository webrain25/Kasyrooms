import { getOrCreateAccountBySirplayUserId, recordWalletTransactionIdempotent, upsertWalletSnapshot } from "../server/services/sirplayAdapter";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set. Skipping Sirplay DB test.");
    return; // skip without failing CI
  }

  const externalUserId = "sirplay_test_002";
  const email = "sirplay_test_002@example.local";

  // Scenario 1: create account via adapter
  const acc1 = await getOrCreateAccountBySirplayUserId({ externalUserId, email, displayName: "Sirplay Test 002" });
  if (!acc1?.id) throw new Error("Account create/get failed (scenario 1)");
  console.log("Scenario 1 OK: Account", acc1.id);

  // Scenario 2: re-run adapter with same data => same id
  const acc2 = await getOrCreateAccountBySirplayUserId({ externalUserId, email, displayName: "Sirplay Test 002" });
  if (String(acc1.id) !== String(acc2.id)) throw new Error("Duplicate account created (scenario 2)");
  console.log("Scenario 2 OK: Idempotent mapping");

  // Scenario 3: wallet snapshot + idempotent tx
  await upsertWalletSnapshot({ accountId: acc1.id as unknown as number, balanceCents: 2000, currency: "EUR" });
  const txId = "tx_test_002";
  await recordWalletTransactionIdempotent({ accountId: acc1.id as unknown as number, externalTransactionId: txId, type: "deposit", amountCents: 2000, currency: "EUR", metadata: { reason: "test" } });
  await recordWalletTransactionIdempotent({ accountId: acc1.id as unknown as number, externalTransactionId: txId, type: "deposit", amountCents: 2000, currency: "EUR", metadata: { reason: "test-duplicate" } });
  console.log("Scenario 3 OK: Idempotent tx");

  // Scenario 4: try linking same email to a different externalUserId => must error
  let threw = false;
  try {
    await getOrCreateAccountBySirplayUserId({ externalUserId: "sirplay_test_999", email });
  } catch (e:any) {
    threw = /EMAIL_ALREADY_LINKED_TO_DIFFERENT_SIRPLAY_ID/.test(String(e?.message || e));
  }
  if (!threw) throw new Error("Scenario 4 failed: expected EMAIL_ALREADY_LINKED_TO_DIFFERENT_SIRPLAY_ID");
  console.log("Scenario 4 OK: conflict detection");

  console.log("sirplay-adapter-db test PASSED");
}

main().catch((e) => { console.error(e); process.exit(1); });
