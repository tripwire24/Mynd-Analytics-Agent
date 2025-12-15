# Security & Environment Setup Guide

## 🔐 For Repository Owner (You)

### What NOT to Commit to GitHub

**NEVER commit these files:**
- `.env` - Contains your actual API keys
- `.env.local` - Contains local development secrets
- `.env.production` - Contains production secrets

✅ **The `.gitignore` file is already configured to prevent this.**

### What IS Safe to Commit

**These ARE safe to commit:**
- `.env.example` - Template file with placeholder values
- `MCP endpoint URL` - It's a public URL, intentionally accessible
- `GA4 Property ID (413266651)` - Already in the code, not a secret

## 🚀 Setup Instructions for Your Client

### Step 1: Clone the Repository

```bash
git clone https://github.com/tripwire24/Mynd-Analytics-Agent.git
cd Mynd-Analytics-Agent
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get a Gemini API Key:**
   - Visit: https://ai.google.dev/gemini-api/docs/api-key
   - Click "Get API Key"
   - Create a new API key or use an existing one

3. **Edit `.env.local` and replace the placeholder:**
   ```
   API_KEY=<paste_their_real_api_key_here>
   ```

### Step 4: Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or similar).

## 📊 How the MCP Server Connection Works

The app automatically connects to your deployed GA4 MCP server:
- **Endpoint**: `https://ga4-mcp-server-ciyqx2rz4q-uc.a.run.app/sse`
- **Property**: Mynd GA4 (413266651)
- **Authentication**: The MCP server uses Google Cloud service account credentials (already configured on Cloud Run)

**The client only needs their Gemini API key** - the MCP connection is handled automatically.

## 🔒 GitHub Secrets (Advanced - Only if Deploying via GitHub Actions)

If you want to deploy this app automatically via GitHub Actions, you can store secrets in your repository:

1. Go to your GitHub repo: https://github.com/tripwire24/Mynd-Analytics-Agent
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add:
   - Name: `API_KEY`
   - Value: Your Gemini API key

**Note**: You don't need this for local development - this is only for CI/CD deployment.

## ⚠️ Security Best Practices

1. **Never share your `.env.local` file** - it contains your API key
2. **Only share `.env.example`** - this is the template without secrets
3. **Tell clients to get their own API key** - don't share yours
4. **The MCP endpoint URL is public** - it's okay to hardcode it in the app
5. **Rotate API keys if compromised** - delete and create a new one

## 🤝 Sharing with Your Client

Send them:
1. ✅ The GitHub repository link
2. ✅ This SECURITY.md file
3. ✅ Instructions to get their own Gemini API key
4. ❌ DON'T send your `.env.local` or actual API key

They will:
1. Clone the repo
2. Get their own Gemini API key
3. Follow the setup instructions above
4. Connect to your MCP server automatically
