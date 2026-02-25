# Tech Stack Guidelines

Focused implementation guidance for styling and icons.

## Tailwind setup

- Tailwind CSS v4 is configured in `src/styles/app.css`.
- Keep theme tokens, animations, and utility declarations centralized in `app.css`.
- Utility classes can be declared with `@utility` in `app.css`.
- Use `cn()` from `@/utils/cn` to compose class lists.

## Styling rules

- Use Tailwind utility classes only; do not introduce custom BEM-style classes.
- Keep custom CSS in `src/styles/app.css` limited to:
  - CSS variables
  - animations
  - scrollbar utilities
- Keep UI compact, readable, and scan-friendly.
- Respect `prefers-reduced-motion` for animation behavior.

## Icon workflow (iconmate)

- Explore commands: `iconmate --help`
- Search icons: `iconmate iconify search <term>`
- Add Solid icon component:
  - `iconmate add --preset=solid --folder src/assets/icons --name <Name> --icon <set:icon>`
- `--preset=solid` generates Solid TSX component files and updates `src/assets/icons/index.ts` exports.
