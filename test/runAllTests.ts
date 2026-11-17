import { spawn } from 'child_process';

interface SuiteResult {
  name: string;
  type: 'Unit' | 'Integration' | 'Security' | 'E2E';
  file: string;
  passed: boolean;
  durationMs: number;
  output: string;
}

const testSuites = [
  { name: 'Unit Tests (Crypto, MFA, Sessions, Token Family)', type: 'Unit' as const, file: 'test/unit/auth.unit.test.ts' },
  { name: 'Integration Tests (API, RBAC & Department Scoping)', type: 'Integration' as const, file: 'test/integration/auth.integration.test.ts' },
  { name: 'Security Tests (IDOR, SQLi, Lockout, Replay, Escalation)', type: 'Security' as const, file: 'test/security/auth.security.test.ts' },
  { name: 'E2E Tests (5 Roles, MFA Flow, Multi-Device Sessions)', type: 'E2E' as const, file: 'test/e2e/auth.e2e.test.ts' },
];

async function runSuite(suite: typeof testSuites[0]): Promise<SuiteResult> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    const proc = spawn(npxCmd, ['tsx', '--test', suite.file], {
      env: { ...process.env, NODE_ENV: 'test' },
      shell: true,
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    proc.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      resolve({
        name: suite.name,
        type: suite.type,
        file: suite.file,
        passed: code === 0,
        durationMs,
        output,
      });
    });
  });
}

async function main() {
  console.log('\n================================================================');
  console.log('🧪 Workforce Analytics Platform (WFA) - Task 3 Full Test Suite');
  console.log('================================================================\n');

  const results: SuiteResult[] = [];

  for (const suite of testSuites) {
    process.stdout.write(`⏳ Running [${suite.type}] ${suite.name}... `);
    const res = await runSuite(suite);
    results.push(res);
    if (res.passed) {
      console.log(`✅ PASSED (${(res.durationMs / 1000).toFixed(2)}s)`);
    } else {
      console.log(`❌ FAILED (${(res.durationMs / 1000).toFixed(2)}s)`);
      console.error(res.output);
    }
  }

  console.log('\n================================================================');
  console.log('📊 Test Execution Summary Report');
  console.log('================================================================');
  console.log('| Suite Type   | Name                                                  | Status  | Time (s) |');
  console.log('|--------------|-------------------------------------------------------|---------|----------|');

  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.type.padEnd(12)} | ${r.name.padEnd(53)} | ${status.padEnd(7)} | ${(r.durationMs / 1000).toFixed(2).padStart(8)} |`);
  }

  const allPassed = results.every((r) => r.passed);
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log('================================================================');
  console.log(`Total Suites:   ${results.length}`);
  console.log(`Suites Passed:  ${results.filter((r) => r.passed).length}`);
  console.log(`Suites Failed:  ${results.filter((r) => !r.passed).length}`);
  console.log(`Total Run Time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Final Verdict:  ${allPassed ? '🎉 ALL TESTS PASSED (100%)' : '⚠️ SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
