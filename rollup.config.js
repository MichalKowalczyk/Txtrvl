import sass from 'rollup-plugin-sass'
import typescript from 'rollup-plugin-typescript2'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const sassLicense = readFileSync(new URL('./node_modules/rollup-plugin-sass/LICENSE', import.meta.url), 'utf8').trim()
// Retain the CSS insertion helper's MIT notice in the generated JavaScript.
const sassLicenseNotice = `/*! rollup-plugin-sass: CSS insertion helper\n${sassLicense}\n*/`

// Both module formats need self-contained declarations in their own format.
const declarations = {
  name: 'txtrvl-declarations',
  writeBundle() {
    const types = readFileSync('dist/Txtrvl/Txtrvl.d.ts', 'utf8')
      .replace(/^import "\.\/Txtrvl\.scss";\r?\n/m, '')
      .replace('export default Txtrvl;', 'export { Txtrvl };')
    writeFileSync('dist/index.d.ts', types)
    writeFileSync('dist/index.d.cts', types)
    // Preserve the previous explicit dist/index.js entry as an ESM alias.
    writeFileSync('dist/index.js', '"use client";\nexport { Txtrvl } from "./index.esm.js";\n')
    if (existsSync('dist/index.js.map')) unlinkSync('dist/index.js.map')
  }
}

export default {
  input: 'src/index.tsx',
  onwarn(warning, warn) {
    // The output banner deliberately preserves this directive in both bundles.
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return
    warn(warning)
  },
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      banner: '"use client";',
      footer: sassLicenseNotice,
      sourcemap: true,
      strict: false
    },
    {
      file: pkg.module,
      format: 'esm',
      exports: 'named',
      banner: '"use client";',
      footer: sassLicenseNotice,
      sourcemap: true,
      strict: false
    }
  ],
  plugins: [sass({ insert: true, output: 'dist/styles.css', outputStyle: 'compressed' }),
  typescript(), declarations],
  external: ['react', 'react-dom']
}
