import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import ts from 'typescript';
const require = createRequire(import.meta.url);
export const React = require('react');
export const { renderToStaticMarkup } = require('react-dom/server');
export const { NextRequest } = require('next/server');
export const { getMiddlewareMatchers } = require('next/dist/build/analysis/get-page-static-info');

// Execute real server component/middleware/helper code. Only network-capable
// session I/O and the payment config are substituted; no .env is loaded.
export function loader(tiers, stubs = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    const imports = name => {
      if (name in stubs) return stubs[name];
      if (name === '@/lib/paypal/config') return { PRICING_TIERS: tiers ?? load('lib/payments/catalog.ts').PRICING_TIERS };
      if (name === '@/lib/payments/catalog') {
        const catalog = load('lib/payments/catalog.ts');
        return { ...catalog, PRICING_TIERS: tiers ?? catalog.PRICING_TIERS };
      }
      if (name === '@/lib/seo/pricing') return load('lib/seo/pricing.ts');
      if (name === '@/lib/supabase/middleware' || name === './lib/supabase/middleware') return { updateSession: () => { throw new Error('SEO middleware must not call session I/O'); } };
      if (name === './lib/i18n-config') return load('lib/i18n-config.ts');
      if (['react','react/jsx-runtime','next/server','@formatjs/intl-localematcher','negotiator'].includes(name)) return require(name);
      if (['next/link', 'next/navigation', 'lucide-react'].includes(name)) return require(name);
      if (name.startsWith('@/') || name.startsWith('.')) {
        const relative = name.startsWith('@/') ? name.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
        for (const suffix of ['.ts', '.tsx']) {
          if (existsSync(new URL(`../../${relative}${suffix}`, import.meta.url))) return load(relative + suffix);
        }
      }
      throw new Error(`Unexpected dependency: ${name}`);
    };
    vm.runInThisContext(`(function(require,module,exports,process){${code}\n})`)(imports,module,module.exports,{env:{}});
    cache.set(file,module.exports);
    return module.exports;
  }
  return load;
}

export function schemas(element) {
  const markup = renderToStaticMarkup(element);
  return [...markup.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
}
