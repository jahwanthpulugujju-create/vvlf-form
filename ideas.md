# VVLF live application form — design directions

## Three possible directions

### Theme Name: Venture Atelier

**Very Brief Intro:** A confident, editorial application experience that feels like entering a curated venture studio. It balances founder-grade clarity with warmth for students who may be applying for their first real project opportunity.

**Probability:** 0.07

### Theme Name: Campus Signal

**Very Brief Intro:** A youthful, energetic application flow inspired by campus notices, workshops, and creative labs. It uses approachable interaction cues and a friendly learning-first tone.

**Probability:** 0.04

### Theme Name: Blueprint Ledger

**Very Brief Intro:** A structured, technical aesthetic using precise labels, calm white space, and a project-intake rhythm. It emphasizes transparency, reviewability, and operational confidence.

**Probability:** 0.09

## Chosen approach: Venture Atelier

### Design Movement

**Contemporary editorial identity systems** with the rhythm of a venture-studio field journal. The experience avoids generic SaaS layout conventions and instead uses a left-anchored application canvas with a narrow narrative rail and large form surfaces.

### Core Principles

1. **Earned confidence:** the application feels ambitious and serious without intimidating beginners.
2. **Narrative progression:** each stage explains why the question matters before asking for an answer.
3. **Visible brand custody:** the VVLF logo is embedded directly and displayed prominently in the fixed identity rail and welcome panel.
4. **Progress without pressure:** concise labels, a stage counter, and soft motion make progress obvious without turning the form into a test.

### Color Philosophy

The brand blue is used as an assertive signal for progress, selected answers, and primary actions. Warm paper white keeps the form human and approachable, while the existing red in the VVLF mark appears only as a small accent to preserve hierarchy. Gradient lighting is subtle and never used behind body copy.

### Layout Paradigm

The desktop experience uses an **asymmetric split canvas**: a stable branding and status rail at left, paired with the current application chapter at right. On mobile, the rail compresses into a compact identity header while the form becomes a single, spacious column.

### Signature Elements

1. A prominent VVLF mark inside a white brand plaque, embedded as data so it never breaks.
2. Blue chapter rules and a vertical stage indicator that makes the path legible at a glance.
3. Softly raised answer cards with small blue selection marks and precise hover transitions.

### Interaction Philosophy

Choices respond with a clear selected state, form chapters slide forward with a small fade, and the footer action area remains easy to reach. There are no distracting animations during typing or keyboard navigation.

### Animation

Chapter transitions use a 220ms opacity-and-translate reveal with a custom ease-out. Choice cards shift by at most 1–2px on hover. Reduced-motion preferences disable non-essential movement.

### Typography System

Use **DM Sans** for body copy and **Fraunces** for large editorial headings. Fraunces introduces a distinctive human, aspirational character while DM Sans retains clarity in answers, labels, and system messages. Headlines are left-aligned, large, and tightly tracked; labels are compact and highly legible.

### Brand Essence

**A learning-first launchpad that helps students turn curiosity into credible venture work.**

**Personality:** considered, energetic, encouraging.

### Brand Voice

Headlines are concise, forward-looking, and non-intimidating. CTAs are direct and reassuring rather than sales-driven.

Example lines: “Choose the work you are ready to grow into.” and “No portfolio? Start with your curiosity.”

### Wordmark & Logo

Use the supplied VVLF Foundation mark exactly as provided, embedded inside the application so it remains visible in every deployment and standalone preview. Do not recreate or alter the logo.

### Signature Brand Color

**VVLF Signal Blue — #2457E6.**

## Style Decisions

- The logo must be embedded directly in the deployed source, not referenced from a relative file path.
- Form submissions use a configurable client-side thank-you state by default; an optional post-submit redirect can be enabled via one visible configuration constant.
- The site is a static live application shell. A real response endpoint, spreadsheet connection, or Typeform submission URL must be configured separately before collecting applicants’ data.
