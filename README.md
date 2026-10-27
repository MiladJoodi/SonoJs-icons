# @sonojs/icons

Brand React icons for [SonoJS](https://sonojs.com/). Copy self-contained `.tsx` files into your app — no runtime import from this package.

**SonoJS:** [Home](https://sonojs.com/) · [Docs](https://sonojs.com/docs) · [Components](https://sonojs.com/docs/components) · [Blocks](https://sonojs.com/blocks) · [Charts](https://sonojs.com/charts) · [Icons gallery](https://icons.sonojs.com)

## Add icons

```bash
npx @sonojs/icons add my-icon
npx @sonojs/icons add icon-one icon-two
```

| Layout | Output |
|--------|--------|
| Has `./src` | `src/components/icons` |
| Otherwise | `components/icons` |

```tsx
import { MyIcon } from "@/components/icons/MyIcon";

<MyIcon size={32} title="My icon" className="brand-icon" />
```

Props: `size`, `title`, `className`, plus standard SVG props.

```bash
npx @sonojs/icons add my-icon --out src/components/icons
npx @sonojs/icons add my-icon --force
```

## License

MIT
