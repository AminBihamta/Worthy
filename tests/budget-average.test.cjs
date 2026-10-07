const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadTypeScriptModule(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      return dependencies[name] ?? require(name);
    },
  });
  return exports;
}

const period = loadTypeScriptModule('../src/utils/period.ts');
const budgetAverage = loadTypeScriptModule('../src/utils/budgetAverage.ts', {
  './period': period,
});

test('daily and weekly averages use inclusive remaining days in a month', () => {
  const now = new Date(2026, 9, 6, 12);
  assert.equal(budgetAverage.getBudgetAverageMinor(2600, 'month', 'daily', now), 100);
  assert.equal(budgetAverage.getBudgetAverageMinor(2600, 'month', 'weekly', now), 700);
});

test('yearly monthly average uses equivalent daily rate across leap years', () => {
  const now = new Date(2024, 0, 1, 12);
  assert.equal(budgetAverage.getBudgetAverageMinor(36600, 'year', 'daily', now), 100);
  assert.equal(budgetAverage.getBudgetAverageMinor(36600, 'year', 'monthly', now), 3044);
});

test('inclusive day count handles the final day of the period', () => {
  const now = new Date(2026, 9, 31, 23, 59);
  assert.equal(budgetAverage.getBudgetAverageMinor(500, 'month', 'daily', now), 500);
});

test('unsupported average options return null and zero remaining allowance stays zero', () => {
  const now = new Date(2026, 9, 6, 12);
  assert.equal(budgetAverage.getBudgetAverageMinor(2600, 'week', 'daily', now), null);
  assert.equal(budgetAverage.getBudgetAverageMinor(0, 'year', 'weekly', now), 0);
});

test('average options are valid only for their supported budget periods', () => {
  assert.equal(budgetAverage.isBudgetAveragePeriodAllowed('month', 'weekly'), true);
  assert.equal(budgetAverage.isBudgetAveragePeriodAllowed('week', 'off'), true);
  assert.equal(budgetAverage.isBudgetAveragePeriodAllowed('week', 'daily'), false);
  assert.equal(budgetAverage.isBudgetAveragePeriodAllowed('year', 'monthly'), true);
});

test('current period detection compares local period boundaries', () => {
  const now = new Date(2026, 9, 6, 12);
  assert.equal(budgetAverage.isCurrentBudgetPeriod(new Date(2026, 9, 1), 'month', now), true);
  assert.equal(budgetAverage.isCurrentBudgetPeriod(new Date(2026, 8, 30), 'month', now), false);
});
