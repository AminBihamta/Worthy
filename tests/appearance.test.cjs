const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

test('startup and theme switches use the RN 0.85 native appearance contract', () => {
  const calls = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/theme/appearance.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.equal(name, 'react-native');
      return {
        Appearance: {
          setColorScheme(style) {
            // Model Android's non-null native argument and supported values.
            assert.ok(['unspecified', 'light', 'dark'].includes(style));
            calls.push(style);
          },
        },
      };
    },
  });

  for (const mode of ['system', 'dark', 'light', 'system']) {
    exports.applyThemeMode(mode);
  }
  assert.deepEqual(calls, ['unspecified', 'dark', 'light', 'unspecified']);
});
