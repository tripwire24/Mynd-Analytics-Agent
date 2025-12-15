<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mynd Analytics Agent

AI-powered analytics assistant for Mynd, connected to Google Analytics 4 via MCP streaming.

**Live App**: https://ai.studio/apps/drive/1FV8_TifFNWI6iB11KuwPiGhgJQImqGML

## Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Gemini API key (get one at https://ai.google.dev/gemini-api/docs/api-key)

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Security & Sharing

- ✅ Safe to share: This repository, `.env.example`, MCP endpoint URL
- ❌ Never share: `.env.local`, your actual API key

**See [SECURITY.md](SECURITY.md) for detailed setup instructions for clients.**

## Features

- Real-time Google Analytics 4 data queries
- AI-powered insights and visualizations
- Connected to live MCP server: `https://ga4-mcp-server-ciyqx2rz4q-uc.a.run.app/sse`
- Supports ALL GA4 metrics and dimensions

## Tech Stack

- React + TypeScript + Vite
- Google Gemini 2.5 Flash
- MCP (Model Context Protocol) for GA4 streaming
- Recharts for data visualization
