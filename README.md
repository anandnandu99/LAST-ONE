# LAST ONE — Survival Tournament Game

A high-stakes 8-contestant survival tournament game built with React, TypeScript, Vite, and Tailwind CSS. Compete across 14 dynamic elimination mini-games against unique AI personalities with custom stats, tactical dialogue, and a multi-stage championship finale.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev

# 3. Build for production
npm run build
```

The production output will be generated inside the `dist/` directory.

---

## 🌐 Deploying to Netlify

This project is pre-configured for instant zero-configuration deployment to Netlify with included `netlify.toml` and `public/_redirects` routing files.

### Option 1: Automatic Deployment via GitHub (Recommended)

1. Push this repository to **GitHub**.
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **"Add new site"** > **"Import an existing project"**.
4. Select **GitHub** and authorize access to your repository.
5. Netlify will automatically detect the build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Click **"Deploy site"**. Every future `git push` to your main branch will trigger an automatic preview and production deployment.

---

### Option 2: Deploy via Netlify CLI

If you prefer to deploy directly from your terminal:

```bash
# 1. Install the Netlify CLI globally
npm install -g netlify-cli

# 2. Build the project
npm run build

# 3. Log in and deploy
netlify login
netlify deploy --prod --dir=dist
```

---

### Option 3: Manual Drag & Drop (Netlify Drop)

1. Run `npm run build` locally in your project folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the generated `dist/` folder onto the browser window.
4. Your site will be published instantly on a live URL.

---

## ⚙️ Netlify Configuration Details

The project includes a `netlify.toml` file with the following configuration to handle client-side single-page application (SPA) routing:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Additionally, `public/_redirects` ensures all deep link paths resolve to `index.html` without 404 errors.

---

## 🎮 Features & Mini-Games

- **8-Contestant Tournament System**: Battle through Round 1 (8 contestants), Round 2 (6 contestants), Round 3 (4 contestants), and the 1v1 Grand Finale.
- **14 Elimination Mini-Games**:
  - *Red Green Run* — High-stakes sprint with fair audio-visual telegraphing
  - *Balance Master* — Dynamic physics platform balance with wind gusts and keyboard/touch controls
  - *Quick Tap* — Precision reflex target shooter with auto-expiring hazard decoys
  - *Memory Tiles*, *Color Switch*, *Safe Path*, *Stop Timer*, *Perfect Cut*, and more.
- **AI Personalities & Stats**: Each AI bot has distinct reaction times, risk tolerance, and dialogue quotes.
- **Locker Room & Customization**: Unlock custom jerseys, avatars, titles, and sound controls.
- **Trophy Room & Daily Challenges**: Track your survival streaks, wins, and high scores.
