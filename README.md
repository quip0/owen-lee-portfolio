# Owen Lee — Personal Portfolio

An interactive single-page portfolio built with vanilla JavaScript and Vite. Features particle effects, interactive animations, and a quantum circuit builder project.

**Live site:** Deployed on GitHub Pages

## Tech Stack

- **Vanilla JS** — no framework, just modern DOM APIs and ES modules
- **Vite** — dev server and production bundler
- **CSS** — custom styles with `clamp()` responsive sizing, cubic-bezier transitions, and procedural grain overlay

## Sections

- **Landing** — click-to-continue prompt with floating hero image and particle effects
- **About** — typewriter bio text, social links (GitHub, Substack), animated text selection
- **Projects** — navigable menu with description popups and loading transitions

## Featured Project: Qubit Circuit Builder

An interactive tool for writing Qiskit-style quantum circuit syntax and visualizing the results in real time. Includes a guided onboarding sequence and 5 built-in examples (Teleportation, Superdense Coding, GHZ State, Phase Estimation, Parameterized C-Phase).

Located in `projects/qubit-circuit-builder/`.

## Getting Started

```bash
npm install
npm run dev        # start dev server
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Project Structure

```
├── index.html                 # main page
├── main.js                    # homepage logic (particles, animations, navigation)
├── styles.css                 # homepage styles
├── projects/
│   └── qubit-circuit-builder/ # standalone project page
├── public/media/              # images and audio assets
└── vite.config.js
```
