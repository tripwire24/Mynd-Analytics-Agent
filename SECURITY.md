# Security & Deployment Guide

## 🚀 Quick Deployment to Vercel (Recommended)

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import the `tripwire24/Mynd-Analytics-Agent` repository
4. Click "Deploy" (default settings work fine)

### Step 2: Add Your API Key

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: All (Production, Preview, Development)
3. Click **Save**
4. **Redeploy** the project (Settings → Deployments → Redeploy)

### Step 3: Access Your App

Your app will be live at: `https://mynd-analytics-agent.vercel.app` (or similar)

Share this URL with your client - they can use it directly!

---

## 🔐 Security Summary

| What | Where it's Stored | Who Can See It |
|------|-------------------|----------------|
| **GEMINI_API_KEY** | Vercel Dashboard (encrypted) | Only you |
| **MCP Endpoint URL** | Hardcoded in app | Public (by design) |
| **GA4 Property ID** | Hardcoded in app | Public (by design) |

---

## 💻 Local Development (Optional)

If you want to run locally instead of using Vercel:

1. Clone the repo: `git clone https://github.com/tripwire24/Mynd-Analytics-Agent.git`
2. Install: `npm install`
3. Copy env file: `cp .env.example .env.local`
4. Edit `.env.local` and add your `GEMINI_API_KEY`
5. Run: `npm run dev`

---

## ⚠️ Never Commit Secrets

The `.gitignore` is configured to prevent committing:
- `.env`
- `.env.local`
- `.env.production`

If you accidentally commit a secret, rotate (delete and recreate) your API key immediately.
