# Worthy Design System

## 1. Design Philosophy
**"Warm Focus – Calm, Sophisticated, and Fresh"**

The Worthy design language is built to make financial management feel approachable, modern, and trustworthy. It combines cool neutral surfaces with a vivid orange brand accent and warm golden highlights, creating an energetic experience that works in both light and dark modes.

### Core Principles
*   **Depth & Clarity:** Deep, rich backgrounds in dark mode with crisp, clean surfaces in light mode.
*   **Tactile Feedback:** Every interaction should feel physical. We use scale animations (`PressableScale`) and haptic feedback (`expo-haptics`) to acknowledge user intent.
*   **Content as Hero:** The most important data (amounts) takes center stage with massive typography, while secondary details recede.
*   **Dual Mode Excellence:** Both light and dark modes are first-class citizens, each with their own carefully crafted palette.

---

## 2. Color System

The implementation currently uses a compact orange-and-gold palette with cool neutrals. Semantic
`app-*` names in `tailwind.config.js` and the matching objects in `src/theme/tokens.ts` are the source
of truth; keep both in sync when changing a token.

### Base Colors
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `bg-app-bg` | `#F8FAFB` | `#121212` | Main screen background. Subtle cool tone. |
| `bg-app-surface` | `#FFFFFF` | `#1E1E1E` | Secondary backgrounds, headers, bottom sheets. |
| `bg-app-card` | `#FFFFFF` | `#1E1E1E` | Main container for grouped content. |

### Content Colors
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `text-app-text` | `#0D1B2A` | `#EAEAEA` | Primary headings, body text. High contrast. |
| `text-app-muted` | `#6B7A8F` | `#A0A0A0` | Secondary labels, subtitles, icons. |
| `bg-app-soft` | `#E8F4F2` | `#282828` | Icon backgrounds, pills, subtle highlights. |

### Brand & Functional
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `bg-app-brand` | `#FF4500` | `#FF4500` | Primary actions, active states, key highlights. |
| `border-app-border`| `#D1DDE6` | `#333333` | Subtle dividers, card borders. |
| `text-app-accent` | `#FFD700` | `#FFD700` | Highlights, warnings, secondary accents. |
| `text-app-success` | `#32CD32` | `#32CD32` | Positive values (Income). |
| `text-app-danger` | `#FF4500` | `#FF4500` | Destructive actions, errors, expenses. |

---

## 3. Typography

We use **Manrope** for its modern, geometric, yet friendly character.

### Font Stack
*   **Display:** `Manrope_600SemiBold` (`font-display`)
*   **Body:** `Manrope_400Regular` (`font-body`)
*   **Emphasis:** `Manrope_500Medium` (`font-emphasis`)
*   **Strong:** `Manrope_700Bold` (`font-strong`)

### Hierarchy
| Component | Size | Weight | Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Amount** | `48px` (5xl) | SemiBold | `text-5xl font-display` | Main account or transaction amount. |
| **Page Title** | `20px` (xl) | Medium | `text-xl font-emphasis` | Screen headers. |
| **Body** | `16px` (base) | Regular | `text-base font-body` | Standard text, inputs. |
| **Label** | `14px` (sm) | Medium | `text-sm font-emphasis` | Button labels, list items. |
| **Caption** | `12px` (xs) | Regular | `text-xs text-app-muted` | Timestamps, secondary info. |
| **Micro** | `10px` | Regular | `uppercase tracking-widest` | Section headers, tiny labels. |

---

## 4. Layout & Spacing

### Border Radius
*   **Cards & Modals:** `28px` (`rounded-3xl`) - The standard shape for content containers.
*   **Inner Elements:** `24px` (`rounded-2xl`) - For nested items like images or inner groups.
*   **Buttons & Icons:** `999px` (`rounded-full`) - For all interactive buttons and icon containers.

### Spacing
*   **Screen Padding:** `px-6` (24px) - Standard horizontal padding for screens.
*   **Card Padding:** `p-5` or `p-6` (20px-24px) - Generous breathing room inside cards.
*   **Gap:** `gap-4` (16px) - Standard distance between related elements.

---

## 5. Components

### Buttons
*   **Primary:** `bg-app-brand` text-white. Rounded full. Used for the main action (e.g., "Save").
*   **Secondary:** `bg-app-surface` with `border-app-border`. Used for alternative actions (e.g., "Edit").
*   **Icon Only:** Circular `w-10 h-10` with `bg-app-soft`. Used for navigation (Back, Menu).

### Cards
*   **Standard Card:** `bg-app-card` with `border-app-border/50`. Used for grouping related details (Category, Account, Date).
*   **Soft Card:** `bg-app-soft`. Used for highlighted sections like "Recurring Info" or "Insights".

### Inputs
*   **Hero Input:** Massive text input that blends into the background. No border.
*   **Standard Input:** Minimalist text input, often right-aligned in a list row.

### Modals (Bottom Sheets)
*   **Style:** `bg-app-card` with `rounded-t-[32px]`.
*   **Overlay:** `bg-black/60` backdrop.
*   **Indicator:** Small pill `w-12 h-1.5 bg-app-border` at the top.

---

## 6. Interaction Design

### PressableScale
All interactive elements (buttons, list rows, cards) should be wrapped in `PressableScale`.
*   **Animation:** Springs down to `0.97` on press and returns to `1` on release.
*   **Haptics:** `PressableScale` triggers `Haptics.selectionAsync()` when its `haptic` prop is true; `Button` triggers selection haptics for enabled actions.

### Transitions
*   **Modals:** Fade in/out for the overlay, slide up/down for the content.
*   **Navigation:** Standard iOS/Android transitions, but custom modal presentations are preferred for "Add/Edit" flows.

## 7. Implementation notes

- Use `PressableScale` for interactive rows and controls where the interaction is part of the shared
  visual language; it provides the 0.97 press scale and optional haptics.
- Use `Card`, `Button`, `Input`, `SelectField`, `MoneyText`, and `PeriodSelector` before creating a
  one-off equivalent.
- The theme supports `system`, `light`, and `dark` through NativeWind's class-based dark mode.
- Typography is loaded from `@expo-google-fonts/manrope`; avoid introducing a second font family.
- `src/theme/tokens.ts` is used for JavaScript styles and chart/navigation colors, while Tailwind
  classes use the duplicated values in `tailwind.config.js`.

---

## 8. Iconography

We use **Feather** icons from `@expo/vector-icons`.

*   **Style:** Simple, outlined icons.
*   **Size:** Generally `18px` or `20px`.
*   **Container:** Often placed inside a `w-10 h-10 rounded-full bg-app-soft` container to create a soft, touchable target.
*   **Color:** Matches the text color (`app-text` or `app-muted`) or `app-brand` for active states.
