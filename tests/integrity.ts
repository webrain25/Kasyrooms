// Basic integrity tests for money flows, tipping, deposits, withdrawals, and session billing.
// Run with: npm test
// Uses direct storage + imported server app where possible (lightweight, not full HTTP harness) to validate invariants.

import assert from 'assert';
import { storage } from '../server/storage';

(async () => {
  const results: string[] = [];
  function pass(label: string) { results.push(`PASS ${label}`); }
  function fail(label: string, err: any) { results.push(`FAIL ${label}: ${err?.message || err}`); }

  try {
    // 1. Deposit shared wallet (simulate external userA) and local wallet (userB)
    const userAExt = 'userA-ext';
    const userB = await storage.createUser({ username: 'moneytest', role: 'user' });
    // assign external id to existing userB for shared vs local scenarios later if needed

    // Shared deposit
    await storage.deposit(userAExt, 100); // +100
    assert.equal(await storage.getBalance(userAExt), 100, 'shared balance should be 100');
    pass('shared deposit');

    // Local deposit
    await storage.localDeposit(userB.id, 50); // +50
    assert.equal(await storage.getLocalBalance(userB.id), 50, 'local balance should be 50');
    pass('local deposit');

    // 2. Withdrawal normal path
    await storage.withdraw(userAExt, 30); // 70 remaining
    assert.equal(await storage.getBalance(userAExt), 70, 'shared balance after withdrawal');
    pass('shared withdrawal');

    // 3. Over-withdraw local should throw and leave balance unchanged
    let threw = false;
    try { await storage.localWithdraw(userB.id, 1000); } catch { threw = true; }
    assert.ok(threw, 'expected local over-withdraw to throw');
    assert.equal(await storage.getLocalBalance(userB.id), 50, 'local balance unchanged after failed withdraw');
    pass('local over-withdraw protection');

    // 4. Tipping invariants (tipping uses withdraw/localWithdraw + transaction log)
    // We'll manually simulate by calling withdraw + addTransaction since route logic already composes these.
    const txBefore = (await storage.listTransactions()).length;
    const tipAmount = 5;
    await storage.withdraw(userAExt, tipAmount);
    await storage.addTransaction({ userId_A: userAExt, type: 'CHARGE', amount: tipAmount, source: 'tip:test' });
    const txAfter = (await storage.listTransactions()).length;
    assert.equal(await storage.getBalance(userAExt), 70 - tipAmount, 'shared balance after tip');
    assert.equal(txAfter, txBefore + 1, 'one new transaction recorded for tip');
    pass('tip transaction logged');

    // 5. Session billing simulation: create a session, fast-forward time by manipulating lastChargeAt
    const modelId = 'm-001'; // seeded model
    const session = await storage.startSession(userB.id, modelId);
    // Add funds locally so billing can deduct
    await storage.localDeposit(userB.id, 20); // now 70 total local (50 existing + 20)
    // Fake lastChargeAt 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60000).toISOString();
    session.lastChargeAt = twoMinutesAgo;
    // Manually invoke a simplified billing tick using same logic constants
    const RATE_PER_MIN = 5.99;
    const lastBefore = await storage.getLocalBalance(userB.id);
    // Charge loop for 2 minutes (floor) = 2 * 5.99
    for (let i = 0; i < 2; i++) {
      await storage.localWithdraw(userB.id, RATE_PER_MIN);
      await storage.addTransaction({ userId_B: userB.id, type: 'CHARGE', amount: RATE_PER_MIN, source: 'test-billing' });
      session.totalCharged = (session.totalCharged || 0) + RATE_PER_MIN;
    }
    session.lastChargeAt = new Date().toISOString();
    const lastAfter = await storage.getLocalBalance(userB.id);
    assert.equal(Number((lastBefore - lastAfter).toFixed(2)), Number((2 * RATE_PER_MIN).toFixed(2)), 'billing deducted correct total');
    pass('session billing deduction');

    // 6. Idempotency markers
    const ref = 'webhook-123';
    assert.equal(await storage.isRefProcessed(ref), false, 'ref initially unprocessed');
    await storage.markRefProcessed(ref);
    assert.equal(await storage.isRefProcessed(ref), true, 'ref marked processed');
    pass('webhook idempotency');

  } catch (e:any) {
    fail('unhandled', e);
  } finally {
    const summary = results.join('\n');
    console.log('\nIntegrity Test Results:\n' + summary + '\n');
    const failed = results.filter(r => r.startsWith('FAIL')).length;
    if (failed > 0) {
      console.error(`Failures: ${failed}`);
      process.exit(1);
    }
  }
})();
