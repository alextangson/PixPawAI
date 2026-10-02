import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');
export const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
export const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
export function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(elements)];
}
export function text(tree) {
  if (typeof tree === 'number' || typeof tree === 'string') return String(tree);
  return React.Children.toArray(tree?.props?.children).map(text).join(' ').replace(/\s+/g, ' ').trim();
}
// A small synchronous hook driver for actual component code; external SDK/HTTP
// are substitutes. Tests explicitly flush effects, change props and unmount.
export function harness(stubs = {}, globals = {}) {
  const slots = [], writes = [], pending = [];
  let index = 0, destroyed = false;
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  const hooks = { ...React,
    useState(initial) {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => {
        if (destroyed) throw new Error('State write after unmount');
        writes.push(value);slots[i].value = typeof value === 'function' ? value(slots[i].value) : value;
      }];
    },
    useRef(value) { const i = index++;return (slots[i] ??= { current: value }); },
    useCallback(fn, deps) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: fn, deps };
      return slots[i].value;
    },
    useEffect(fn, deps) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) pending.push(() => {
        slots[i]?.cleanup?.();slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  function load(file) {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    const imports = name => {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name in stubs) return stubs[name];
      if (name === 'lucide-react') return new Proxy({}, { get: () => 'svg' });
      if (name === 'next/link') return 'a';
      throw new Error(`Unexpected dependency: ${name}`);
    };
    const names = Object.keys(globals);
    vm.runInThisContext(`(function(require,module,exports,${names.join(',')}){${code}\n})`)(imports,module,module.exports,...Object.values(globals));
    return module.exports;
  }
  return { load, writes,
    render(component, props, container) {
      index = 0;
      const tree = component(props);
      for (const element of elements(tree)) if (element.ref && typeof element.ref === 'object') element.ref.current = container;
      return tree;
    },
    flush() { pending.splice(0).forEach(fn => fn()); },
    unmount() { slots.forEach(slot => slot.cleanup?.());destroyed = true; },
  };
}
