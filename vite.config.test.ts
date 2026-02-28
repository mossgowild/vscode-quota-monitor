import { defineConfig, type Plugin } from 'vite';
import { readdirSync, writeFileSync } from 'node:fs';
import { join, isAbsolute, resolve } from 'node:path';

/** Only test files are needed as entries; Rollup traces all imports automatically. */
function resolveTestEntries(): Record<string, string> {
  const dir = 'src/composables/__tests__';
  return Object.fromEntries(
    readdirSync(dir, { encoding: 'utf-8' })
      .filter(f => f.endsWith('.ts'))
      .map(f => [
        // Key must include the full src-relative path so Rollup outputs to the
        // correct subdirectory (e.g. composables/__tests__/foo.test.js).
        `composables/__tests__/${f.replace(/\.ts$/, '')}`,
        resolve(dir, f),
      ]),
  );
}

/** Write dist/package.json so Node treats CJS output as CommonJS. */
function injectCjsPackageJson(): Plugin {
  return {
    name: 'inject-cjs-package-json',
    writeBundle({ dir }) {
      writeFileSync(join(dir!, 'package.json'), '{"type":"commonjs"}\n');
    },
  };
}

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: resolveTestEntries(),
      external: (id: string) => !id.startsWith('.') && !isAbsolute(id),
      preserveEntrySignatures: 'strict',
      output: {
        format: 'cjs',
        preserveModules: true,
        preserveModulesRoot: resolve('src'),
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [injectCjsPackageJson()],
});
