# @sonojs/icons — Delivery Plan

## Goal

Standalone English-first LTR icons product: CLI (`npx @sonojs/icons add …`) + single-family registry + Vite gallery. SonoJS fonts/tokens; gallery density from the reference icons playground.

## Exclude

- Any second stroke-icon family (assets, registry, scripts, CLI flags, gallery pages)
- Dumping icon corpus into other product registries
- Naming third-party icon brands in UI, docs, CLI, or folders

## Layout

- Category sidebar on the **start** edge (left in LTR)
- Mobile category drawer slides from the start edge

## Asset placement

Put SVG sources here (empty until you add them):

```
I:\Github\new\Sono\SonoJs-icons\assets\
```

Registry (CLI payload):

```
I:\Github\new\Sono\SonoJs-icons\registry\
```

Then run `npm run generate` once generators are wired for your pack layout.

## CLI defaults

- Out: `./src` exists → `src/components/icons`, else `components/icons`
- Props: `size`, `variant` (`color` \| `mono`), `title`, `className`

## Definition of done

- Packable `@sonojs/icons`
- Gallery EN + LTR + SonoJS tokens; sidebar on the left
- CLI adds icons from registry
- Zero third-party icon-brand naming in UI/docs/CLI/folders
