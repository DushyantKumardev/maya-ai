# 🎨 Styling Guide

Maya AI uses **Tailwind CSS v4** combined with **CSS Variables** for a highly flexible and themeable UI.

---

## 🏗️ The Design System

Maya's styles are driven by CSS variables defined in `src/app/globals.css`. This allows for real-time theme switching (Light/Dark mode) without re-generating CSS.

### Core Theme Tokens
We use standard Shadcn-like tokens for consistency:
- `--background`, `--foreground`: Base page colors.
- `--primary`, `--primary-foreground`: Main action colors.
- `--secondary`, `--accent`, `--muted`: Background variations for chips, cards, and sidebars.
- `--border`, `--input`, `--ring`: UI element borders and focus states.
- `--radius`: Global corner roundness (default is `1rem`).

---

## 🚀 Tailwind CSS v4

In v4, configuration is moved directly into the CSS file using the `@theme` directive.

### Using Theme Variables
You can use standard Tailwind classes which are automatically mapped to our CSS variables:
```tsx
<div className="bg-background text-foreground border-border rounded-lg p-4 shadow-sm">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
    Click Me
  </button>
</div>
```

### Custom Typography
- `font-sans`: Primary application font (Inter/System).
- `font-mono`: Code and technical details (JetBrains Mono).
- `font-serif`: Specialized content (Merriweather).

---

## ✨ Custom Utilities & Animations

Maya includes several specialized utility classes for a premium feel:

### Shimmer Effects
Used for loading states (skeletons):
- `.animate-shimmer`: A linear shimmer animation.
- `.animate-pulse`: Standard pulsing for icons.

### Scrollbars
Use the `.custom-scrollbar` class on any overflowing container to get a sleek, minimal scrollbar that matches the theme.

### Glassmorphism
To create "glass" effects, use backdrop blur and semi-transparent backgrounds:
```tsx
<div className="bg-background/60 backdrop-blur-xl border-border/50">
  {/* Glass content */}
</div>
```

---

## 🛠️ Components (Shadcn UI)

Maya uses a customized set of Shadcn UI components located in `src/components/ui/`. 
- **Icons**: We use `lucide-react` for all iconography.
- **Animations**: We use `motion` (Framer Motion) for complex transitions and `tailwind-animate` for simple CSS-based entry/exit animations.

---

## 🌓 Dark Mode

Maya uses `next-themes` for theme management. It is configured in `src/app/layout.tsx` with `attribute="class"`, which means it automatically applies the `.dark` class to the `html` element when dark mode is active.

All colors will automatically transition based on the variables defined in the `.dark` block of `globals.css`.

> [!IMPORTANT]
> When adding new colors, you must perform **three** steps:
> 1. Define the variable in the `:root` block (Light Mode).
> 2. Define the variable in the `.dark` block (Dark Mode).
> 3. Register the variable in the `@theme inline` block in `globals.css` using the `--color-` prefix (e.g., `--color-my-brand: var(--my-brand);`) to enable Tailwind classes like `bg-my-brand`.
