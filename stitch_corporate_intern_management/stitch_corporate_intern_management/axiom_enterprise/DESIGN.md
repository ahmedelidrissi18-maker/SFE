# Design System Specification: The Architectural Ledger

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Architectural Ledger**. 

Traditional enterprise SaaS often feels like a dense spreadsheet—cluttered, rigid, and exhausting. This system moves toward an editorial, premium experience that treats data with the same reverence a gallery treats art. We achieve "Professional and Calm" not through emptiness, but through intentional structural depth, asymmetric white space, and a rejection of traditional UI "fencing" (borders). The goal is a workspace that feels like a physical desk: layers of high-quality paper stacked in a clean, sunlit room.

## 2. Colors & Tonal Depth
The palette is rooted in a "White-on-Off-White" philosophy to reduce cognitive load while using a deep Indigo (`#3f51b5`) to command attention at key interaction points.

### The "No-Line" Rule
Standard 1px solid borders are prohibited for sectioning. To define boundaries, designers must use **Background Color Shifts**. 
*   **Main Workspace:** Use `surface`.
*   **Sectioning:** Use `surface_container_low` to carve out functional areas within the workspace.
*   **Nesting:** High-priority content areas use `surface_container_lowest` (Pure White) to "pop" against the darker surface tiers.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
*   **Base Layer:** `surface` (#f9f9fa)
*   **Sunken Elements (Sidebar/Trays):** `surface_container_low` (#f3f3f4)
*   **Elevated Elements (Cards):** `surface_container_lowest` (#ffffff)
*   **Interaction Layers:** `surface_container_high` (#e8e8e9) for hover states on subtle elements.

### Glass & Signature Textures
To break the "flat" look, use **Glassmorphism** for floating elements like dropdowns or popovers. Use `surface_container_lowest` at 80% opacity with a `20px` backdrop blur. 
*   **Signature Gradient:** For primary CTAs, apply a subtle linear gradient from `primary` (#24389c) to `primary_container` (#3f51b5) at a 135-degree angle. This adds "visual soul" and depth that a flat hex code cannot achieve.

## 3. Typography
We use **Inter** exclusively to maintain a modern, neutral, and highly legible foundation. The hierarchy is designed to feel editorial, using scale rather than weight to signify importance.

*   **Display/Headline (22px - `headline_md`):** Weight 500. Reserved for page titles. Use generous tracking (-0.02em) to create a sophisticated, "tight" look.
*   **Subheaders (18px - `title_md`):** Weight 500. Used for section headers within cards.
*   **Body (15px - `body_lg`):** Weight 400. The workhorse for all data entry and reading. Ensure a line-height of 1.6 to maintain "calm" readability.
*   **Metadata (13px - `label_md`):** Weight 400. Use `on_surface_variant` (#454652) to create a clear visual distinction from primary content.

## 4. Elevation & Depth
In this system, depth is communicated through light and physics rather than lines.

### The Layering Principle
Hierarchy is achieved by "stacking" tones. Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a natural, soft lift that feels integrated into the environment.

### Ambient Shadows
For floating components (modals, tooltips), use **Ambient Shadows**. 
*   **Token:** `0px 12px 32px rgba(26, 28, 29, 0.06)`. 
*   The shadow color is derived from `on_surface`, ensuring it looks like a natural occlusion of light rather than a gray smudge.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**.
*   **Rule:** Use `outline_variant` (#c5c5d4) at 30% opacity. 
*   100% opaque borders are strictly forbidden as they create "visual noise" and break the calm aesthetic.

## 5. Components

### Shell & Navigation
*   **Sidebar:** Fixed 240px. Background: `surface_container_low`. Use `primary` for the active state indicator—a subtle 4px vertical pill on the left edge.
*   **Header:** Fixed 56px. Background: `surface_container_lowest` with a 1px "Ghost Border" bottom edge.

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `on_primary` text, 8px (`DEFAULT`) corners.
*   **Secondary:** `surface_container_high` background, `on_surface` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text.

### Cards & Lists
*   **Cards:** 12px (`md`) corners. Background: `surface_container_lowest`. 
*   **List Separation:** **Forbid dividers.** Use `16px` of vertical white space to separate list items. For dense data, use alternating row tints of `surface_container_low` (zebra striping) instead of lines.

### Input Fields
*   **Style:** 8px (`DEFAULT`) corners. Background: `surface_container_lowest`. 
*   **State:** On focus, transition the "Ghost Border" to 100% opacity `primary` with a 2px outer glow of `primary_fixed_dim` at 20% opacity.

### Chips & Badges (Semantic)
Use soft, desaturated backgrounds with high-contrast text:
*   **Active:** `surface_container_highest` background with `primary` text.
*   **Pending:** `tertiary_fixed` background with `on_tertiary_fixed_variant` text.
*   **Rejected:** `error_container` background with `on_error_container` text.

## 6. Do's and Don'ts

### Do:
*   **Do** use white space as a functional tool. If a screen feels cluttered, increase the padding between sections rather than adding a border.
*   **Do** lean into asymmetry. A right-aligned metadata label against a left-aligned title creates a sophisticated editorial rhythm.
*   **Do** use `on_surface_variant` for all non-essential text to keep the interface feeling "quiet."

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#1a1c1d) to maintain the "calm" profile.
*   **Don't** use standard "Drop Shadows" from component libraries. Always use the specified Ambient Shadow values.
*   **Don't** use 1px dividers to separate content. Use background tonal shifts or increased spacing.