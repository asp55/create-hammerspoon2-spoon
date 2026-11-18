// Hammerspoon 2 loads spoons through require(), but hammerspoon.d.ts doesn't
// declare the CommonJS globals. Minimal shims so `require`/`module` type-check.
declare const module: { exports: unknown };
declare function require(id: string): any;
