# YT Binger

Binge-watch a YouTube channel from oldest to newest without missing a video. Track what you've watched, set your current position, and get a recommendation for what to watch next.

All watch progress is stored in your browser's **localStorage** — nothing is saved on a server except API calls to fetch channel data.

## Features

- Paste a channel URL or `@handle` to load every public video
- Videos listed oldest → newest (or reverse)
- Mark videos as watched / unwatched
- Set "I'm up to here" to resume from any point
- **Next to watch** card updates automatically
- Video list cached locally for 24 hours

## Prerequisites

- Node.js 20+
- A [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key

### Getting a YouTube API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable **YouTube Data API v3** under APIs & Services → Library
4. Go to APIs & Services → Credentials → Create credentials → **API key**
5. (Recommended) Restrict the key to YouTube Data API v3 only
6. For production, add your Vercel domain to HTTP referrer restrictions

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your YOUTUBE_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variable: `YOUTUBE_API_KEY` = your API key
4. Deploy

No database or other services required.

## Supported channel URL formats

- `https://www.youtube.com/@handle`
- `https://www.youtube.com/channel/UC…`
- `https://www.youtube.com/c/customname`
- `https://www.youtube.com/user/username`
- Raw `@handle` or channel ID

## How "next video" works

With **oldest first** (default):

- If you've set a **latest watched** video → next is the one immediately after it in the list
- Otherwise → first unwatched video in the list
- **Mark watched** sets that video as latest watched and advances the recommendation

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- YouTube Data API v3
- localStorage for progress and video cache
