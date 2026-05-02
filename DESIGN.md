---
name: Fintech Modernist
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#46464a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#77777b'
  outline-variant: '#c7c6ca'
  surface-tint: '#5f5e5f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1c'
  on-primary-container: '#858384'
  inverse-primary: '#c8c6c7'
  secondary: '#4854bb'
  on-secondary: '#ffffff'
  secondary-container: '#8692fd'
  on-secondary-container: '#16238e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002109'
  on-tertiary-container: '#009844'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1c1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000965'
  on-secondary-fixed-variant: '#2e3aa2'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 32px
  section-padding: 120px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system is built on a foundation of **Modern Corporate Minimalism**. It prioritizes clarity and functional beauty to foster a sense of security and technological advancement. The aesthetic is defined by expansive white space, a disciplined color palette, and high-fidelity mockups that showcase the product in a tangible, premium light. 

The emotional response should be one of quiet confidence; the UI does not shout, but rather guides the user through complex financial data with effortless grace. It is designed for a target audience that values efficiency, modern aesthetics, and professional reliability.

## Colors

The palette is anchored by a deep, near-black navy used for primary headings and high-priority action buttons. This provides a strong visual anchor against the dominant white and light gray backgrounds. 

- **Primary:** Used for the "North Star" actions (CTAs) and structural headings.
- **Secondary:** A sophisticated blue for interactive subtle elements or links.
- **Tertiary:** A functional green for positive financial trends and success states.
- **Neutrals:** A range of cool grays used to differentiate sections and create container depth without adding visual noise.

## Typography

The typography strategy uses **Manrope** for headlines to inject a modern, geometric personality that remains highly legible. Its slightly condensed nature allows for impactful large-scale type. 

**Inter** is utilized for all body copy and UI labels to ensure maximum clarity and a systematic, functional feel. The hierarchy relies on significant scale differences and tight letter-spacing for large headlines to maintain a "high-fashion" tech aesthetic.

## Layout & Spacing

The design system employs a **Fixed Grid** layout for the landing page to maintain a premium, editorial feel. A 12-column grid is the standard, but with a significant "inner-margin" approach where content often breathes in the center 8-10 columns.

Spacing is generous. Vertical rhythm is defined by large gaps between sections (120px+) to allow the eye to rest and emphasize the importance of each feature block. Internal component spacing follows a strict 8px base unit.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Ambient Shadows**. 

Depth is primarily created by placing white "cards" or "modules" on top of light gray (#F1F3F5) backgrounds. When shadows are used for floating elements (like mobile mockups or tooltips), they should be extremely diffused (30-40px blur) with very low opacity (3-5%). This creates a "lift" rather than a "drop," making elements feel like they are gently hovering above the surface.

## Shapes

The shape language is defined by a consistent **Rounded (Level 2)** approach. Standard UI elements like buttons and input fields utilize a 0.5rem (8px) radius, while larger containers and product mockups use 1rem (16px) or 1.5rem (24px) to emphasize a soft, approachable, and modern hardware-like feel. This consistency between the digital UI and the physical device mockups creates a unified brand experience.

## Components

### Buttons
- **Primary:** Solid dark navy (#0A0A0B) with white text. High contrast, sharp but rounded corners.
- **Secondary:** Transparent background with a light gray border or a subtle gray fill.
- **CTA Small:** Used in navigation, same style as primary but reduced padding.

### Cards
Cards should be used to encapsulate features or data points. They feature a white background, subtle border (1px #E9ECEF), and a soft ambient shadow on hover. Internal padding should be generous (min 32px).

### Data Visualizations
Charts and graphs should use a minimalist line-art style. Use the primary navy for main data lines and the tertiary green for "growth" indicators. Background grids within charts should be nearly invisible.

### Input Fields
Inputs are clean with a light gray background and no border in their default state. Upon focus, they transition to a white background with a thin navy border and a subtle glow.

### Product Mockups
Use high-fidelity 3D renders or high-res flat mockups of mobile and desktop interfaces. These should be treated as primary visual assets, often overlapping container boundaries to create a dynamic, layered look.