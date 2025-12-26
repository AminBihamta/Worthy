# Worthy Design System

## 1. Design Philosophy
**"Midnight Aurora – Calm, Sophisticated, and Fresh"**

The Worthy design language is built to make financial management feel approachable, modern, and trustworthy. It combines the depth and professionalism of oceanic teals with warm golden accents, creating a premium experience that works beautifully in both light and dark modes.

### Core Principles
*   **Depth & Clarity:** Deep, rich backgrounds in dark mode with crisp, clean surfaces in light mode.
*   **Tactile Feedback:** Every interaction should feel physical. We use scale animations (`PressableScale`) and haptic feedback (`expo-haptics`) to acknowledge user intent.
*   **Content as Hero:** The most important data (amounts) takes center stage with massive typography, while secondary details recede.
*   **Dual Mode Excellence:** Both light and dark modes are first-class citizens, each with their own carefully crafted palette.

---

## 2. Color System

Our palette is based on a **"Midnight Aurora"** theme – oceanic teals meet warm golden accents. We use semantic naming (`app-*`) to ensure seamless dark mode support.

### Base Colors
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `bg-app-bg` | `#F8FAFB` | `#0D1117` | Main screen background. Subtle cool tone. |
| `bg-app-surface` | `#FFFFFF` | `#161B22` | Secondary backgrounds, headers, bottom sheets. |
| `bg-app-card` | `#FFFFFF` | `#1C2432` | Main container for grouped content. |

### Content Colors
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `text-app-text` | `#0D1B2A` | `#E6EDF3` | Primary headings, body text. High contrast. |
| `text-app-muted` | `#6B7A8F` | `#8B949E` | Secondary labels, subtitles, icons. |
| `bg-app-soft` | `#E8F4F2` | `#243447` | Icon backgrounds, pills, subtle highlights. |

### Brand & Functional
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `bg-app-brand` | `#0A9396` | `#58D5D8` | Primary actions, active states, key highlights. |
| `border-app-border`| `#D1DDE6` | `#30363D` | Subtle dividers, card borders. |
| `text-app-accent` | `#EE9B00` | `#FFB703` | Highlights, warnings, secondary accents. |
| `text-app-success` | `#38B000` | `#3FB950` | Positive values (Income). |
| `text-app-danger` | `#D62828` | `#F85149` | Destructive actions, errors, expenses. |

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
| **Hero Amount** | `72px` (7xl) | SemiBold | `text-7xl font-display` | Main transaction amount. |
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
*   **Animation:** Scales down to `0.97` on press.
*   **Timing:** 140ms duration.
*   **Haptics:** Triggers `Haptics.selectionAsync()` on press.

### Transitions
*   **Modals:** Fade in/out for the overlay, slide up/down for the content.
*   **Navigation:** Standard iOS/Android transitions, but custom modal presentations are preferred for "Add/Edit" flows.

---

## 7. Iconography

We use **Feather** icons from `@expo/vector-icons`.

*   **Style:** Simple, outlined icons.
*   **Size:** Generally `18px` or `20px`.
*   **Container:** Often placed inside a `w-10 h-10 rounded-full bg-app-soft` container to create a soft, touchable target.
*   **Color:** Matches the text color (`app-text` or `app-muted`) or `app-brand` for active states.
