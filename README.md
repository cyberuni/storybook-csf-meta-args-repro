# storybook-csf-meta-args-repro

Minimal reproduction for [storybookjs/storybook#32829](https://github.com/storybookjs/storybook/issues/32829): in CSF Next (CSF factories), `preview.meta({ args })` silently loses its captured args when any arg has a **string- or number-literal union** type. Every subsequent `meta.story()` call then re-demands the component's required props.

## Reproduce

```sh
npm install
npm run typecheck
```

Expected: clean. Actual: two `TS2769` errors, both in `src/stepper.stories.tsx`.

```
src/stepper.stories.tsx(28,38): error TS2769: No overload matches this call.
    Property 'children' is missing in type '{ tags: string[]; }'
    but required in type '{ children: ReactNode; ... }'.
```

## What each file shows

| File | Result | Purpose |
|---|---|---|
| `src/stepper.stories.tsx` | ❌ 2 × `TS2769` | The bug. `direction: 'horizontal'` in `meta.args`. |
| `src/stepper_workaround.stories.tsx` | ✅ clean | Identical, but `direction: 'horizontal' as const`. |
| `src/box_control.stories.tsx` | ✅ clean | No literal-union prop, no `as const`, no error. |

Together these isolate the trigger to literal-type widening in `meta({ args })`.

## Why it is confusing

1. **The error is reported on the wrong line.** The fault is the `meta({ args })` object, but TypeScript flags the `meta.story()` calls below it — sometimes hundreds of lines away in a real story file.
2. **The error text is misleading.** It says `children` is missing, but `meta.args` visibly supplies `children`.
3. **Adding `args: { children }` to `meta` does not help** — it is already there and already being discarded. Adding it to the *story* does help, which points the reader away from the real cause.
4. **It tempts an API regression.** The path of least resistance is to make the required prop optional in the component's own types, degrading the production API to satisfy a tooling bug.

## Root cause

`ReactPreview.meta()` in `renderers/react/src/preview.tsx`:

```ts
meta<TArgs extends Args, TMetaArgs extends Partial<TArgs & T['args']>>(
  meta: { render?: ...; component?: ComponentType<TArgs>; args?: TMetaArgs; ... },
): ReactMeta<{ args: Simplify<TArgs & Args> }, TMetaArgs>
```

`TMetaArgs` is constrained by `Partial<TArgs & T['args']>`, and that constraint references `TArgs` — which is itself still an inference target, being inferred from `component`. When an arg's literal type needs widening to satisfy the constraint, TypeScript abandons inference for `TMetaArgs` and substitutes the constraint itself.

So `TMetaArgs` becomes `Partial<TArgs>`. `ReactMeta.story()` then applies:

```ts
Partial<T['args']> extends TMetaArgs ? {} : TMetaArgs
```

With `TMetaArgs = Partial<TArgs>` the condition is trivially true, so the captured meta args collapse to `{}`. `SetOptional<T['args'], keyof T['args'] & keyof MetaInput['args']>` intersects with no keys, leaving every required prop required at the story level.

`boolean`, `string`, `number`, `ReactNode` and `unknown` args are unaffected because they need no widening.

## Fix

Add TypeScript's [`const` type-parameter modifier](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters) to `TMetaArgs`, so the literal is preserved instead of widened:

```diff
-  meta<TArgs extends Args, TMetaArgs extends Partial<TArgs & T['args']>>(
+  meta<TArgs extends Args, const TMetaArgs extends Partial<TArgs & T['args']>>(
```

This is exactly what [PR #36134](https://github.com/storybookjs/storybook/pull/36134) already did for the **Vue 3** renderer. As of `next` (`11.0.0-alpha.0`) the modifier is still missing from `renderers/react`, `renderers/web-components`, and `frameworks/angular`.

`const` type parameters require TypeScript ≥ 5.0, while `@storybook/react` currently declares a `typescript >= 4.9.x` peer range — which is why the issue is milestoned for Storybook 11.

## Workaround (works on stock Storybook today)

Suffix every literal-union value in `meta({ args })` with `as const`:

```diff
 const meta = preview.meta({
   component: Stepper,
   args: {
-    direction: 'horizontal',
+    direction: 'horizontal' as const,
     children: 'step content',
   },
 })
```

Alternatives, in descending order of preference:

- Give each story a zero-parameter `render: () => <Component ... />`; that overload waives all required args.
- Repeat the required arg in each story's own `args`.
- **Do not** make the component's required prop optional. That is a production API regression used to work around a type-inference bug in tooling.

## Environment

| | |
|---|---|
| `storybook` | 10.5.7 |
| `@storybook/react-vite` | 10.5.7 |
| `typescript` | 5.9.3 |
| `react` | 18.3.1 |
