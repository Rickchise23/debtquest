# DebtQuest 🎯

Gamified debt payoff tracker PWA for couples.

## Deploy in 5 minutes

### 1. Unzip & open in Cursor
```bash
unzip debtquest-app.zip -d debtquest
cd debtquest
npm install
```

### 2. Test locally
```bash
npm run dev
```
Open http://localhost:5173 on your browser. Everything should work.

### 3. Deploy to Vercel

**Option A — Vercel CLI (fastest):**
```bash
npm i -g vercel
vercel
```
Follow the prompts. Done. You'll get a URL like `debtquest-xxx.vercel.app`.

**Option B — GitHub + Vercel dashboard:**
1. Push to a GitHub repo:
   ```bash
   git init && git add -A && git commit -m "DebtQuest v1"
   gh repo create debtquest --private --push
   ```
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Framework: Vite. Leave defaults. Deploy.

### 4. Add to your iPhones
1. Open the Vercel URL in Safari on both phones
2. Tap Share → "Add to Home Screen"
3. It now looks and works like a native app

## Tech Stack
- **React 18** + **Vite 6**
- **Dexie.js** (IndexedDB) — all data stays on-device, no server
- **Recharts** — projection charts
- **vite-plugin-pwa** — service worker, offline support, home screen install
- **Vercel** — free hosting, automatic HTTPS

## Data
All data is stored in IndexedDB on each device. Use Settings → Export to back up as JSON. No data ever leaves your phone.

## Custom Domain (optional)
In Vercel dashboard → Settings → Domains → add `debtquest.yourdomain.com` or whatever you want.
