# @sonojs/icons

SonoJS brand React icons. Browse the gallery locally, then copy icon components into your app with the CLI.

## Install

```bash
npm i @sonojs/icons
```

You do not import icons from the package at runtime. Use the CLI to copy self-contained `.tsx` files into your project.

## Add icons

```bash
npx @sonojs/icons add my-icon
npx @sonojs/icons add icon-one icon-two
```

### Output directory

| Project layout | Icons land in |
|----------------|---------------|
| Has `./src` | `src/components/icons` |
| Otherwise | `components/icons` |

### Usage after add

```tsx
import { MyIcon } from "@/components/icons/MyIcon";

<MyIcon size={32} title="My icon" className="brand-icon" />
```

**Props:** `size`, `title`, `className` (plus standard SVG props). Icons keep their original artwork (brand colors or stroke marks).

### Options

```bash
npx @sonojs/icons add my-icon --out src/components/icons
npx @sonojs/icons add my-icon --force
npx @sonojs/icons add my-icon --registry ./registry
```

## Local gallery

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Adding artwork

Sources live under `assets/`:

| Folder | Role |
|--------|------|
| `assets/crypto/` | Crypto brands → sidebar **Crypto** |
| `assets/dev/` | Dev / product marks → sidebar **Dev** |
| `assets/general/` | Stroke icons + optional `*.json` metadata → topical categories (`arrows`, `files`, …) |

```bash
npm run generate   # rebuilds registry/ + src/generated/
npm run dev        # gallery
```

## License

MIT
