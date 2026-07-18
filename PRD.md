# Chatter — Chat Log Explorer PRD

## Product Overview

Chatter is a local-first PWA that transforms exported chat logs from WhatsApp, Telegram, Discord, and Signal into a beautiful, interactive dashboard. **No account, no server upload, no AI API key** — everything runs entirely in the browser.

## Core Flow

1. **Landing page** — drag-and-drop file upload with format badges (WhatsApp, Telegram, Discord, Signal)
2. **Parser runs client-side** — extracts messages, senders, timestamps, emojis
3. **Dashboard renders** — 6 visualization panels + a "Chat Wrapped" shareable card
4. **All data stays in-browser** — no server round-trip

## Screens/Pages

| Screen | Purpose | Key UI |
|---|---|---|
| **Upload** | File import | Drag-and-drop zone + format badges + sample data button |
| **Dashboard** | Full analytics view | Tabbed panels: Overview, Activity, People, Emojis, Words, Timeline |
| **Chat Wrapped** | Shareable summary | Single animated card with top stats (Spotify Wrapped style) |

## Data Model

```typescript
interface Message {
  sender: string;
  text: string;
  timestamp: Date;
  isMedia: boolean;
  emojis: string[];
}

interface ChatAnalysis {
  participants: string[];
  totalMessages: number;
  totalWords: number;
  totalEmojis: number;
  dateRange: { start: Date; end: Date };
  messagesPerDay: Record<string, number>;   // "YYYY-MM-DD" -> count
  messagesByHour: Record<number, number>;   // 0-23 -> count
  messagesBySender: Record<string, number>;
  wordsBySender: Record<string, number>;
  emojiStats: { emoji: string; count: number; sender: string }[];
  topWords: { word: string; count: number }[];
  streaks: { longest: number; current?: number };
  dailyActivity: Record<string, number>;     // day of week (0-6) -> count
}
```

## Dashboard Panels

### 1. Overview — Top stats cards
- Total messages, words, emojis, media count
- Date range and total days
- Participants count

### 2. Activity Heatmap (Calendar Grid)
- Day-of-week × Hour-of-day heatmap (7 rows × 24 cells)
- Color intensity = message frequency
- Dark theme-optimized colors

### 3. People — Per-person breakdown
- Bar chart: messages per sender
- List: each person's word count, avg message length, emoji count
- Color-coded per participant

### 4. Emoji Dashboard
- Top 20 emoji wall (large emoji grid, size = frequency)
- Emoji usage per person (breakdown)
- Most emoji-heavy messages

### 5. Word Cloud
- Overall word cloud (filter common stop words)
- Toggle to view per-person word cloud
- Color palette per participant

### 6. Sentiment/Activity Timeline
- Messages over time (line chart, grouped by day/week)
- Streak highlights with fire emoji indicator
- Busiest day annotation

## Chat Wrapped (Bonus Feature)
- Single shareable card with: total messages, most active day, top emoji, most active person, longest streak
- Animated reveal (Framer Motion or CSS keyframes)
- Screenshot/download as PNG

## Parser Support

| Platform | Format | Key Extraction |
|---|---|---|
| **WhatsApp** | `_chat.txt` (export) | `[date, time] Sender: message` |
| **Telegram** | `result.json` (export) | Structured JSON with messages array |
| **Discord** | `messages.csv` or `channel.json` | CSV with timestamp/author/content |
| **Signal** | `_chat.txt` (export) | Similar to WhatsApp format |

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Vite + React 19 + TypeScript | Fully client-side, no SSR needed |
| **Bundler** | Vite 6 | Fast HMR, PWA plugin |
| **Styling** | Tailwind CSS 4 | Rapid UI, dark theme |
| **Charts** | Recharts or Chart.js | Heatmap, bar, line |
| **Word Cloud** | react-wordcloud | Client-side word cloud |
| **PWA** | vite-plugin-pwa | Offline-capable installable app |
| **Animations** | Framer Motion | Wrapped card reveal |
| **File parsing** | Custom pure JS | No deps needed for text parsing |

## Design

- **Dark theme** — deep gray/charcoal background, warm accent colors (amber/gold)
- **Per-participant color palette** — auto-assigned from a curated set
- **Responsive** — desktop-first but works on tablet
- **Font** — system sans-serif stack

## MVP Scope

### In scope (v1)
- WhatsApp `_chat.txt` parser (most popular format)
- Full dashboard with 6 panels
- Activity heatmap
- Per-person stats
- Emoji wall
- Word cloud
- Activity timeline with streaks
- Dark theme
- Local-first (no server)
- File drag-and-drop upload

### Out of scope (post-v1)
- Telegram/Discord/Signal parsers
- Chat Wrapped shareable card
- Multi-chat comparison
- Export/screenshot save
- PWA offline support
- Sentiment analysis (would need AI)

## Build Order

1. Types & Data Model → `src/types.ts`
2. Parsing Engine → `src/parsers/whatsapp.ts`
3. Analysis Engine → `src/lib/analyze.ts`
4. React hooks → `src/hooks/useChatAnalysis.ts`
5. Upload component → `src/components/UploadZone.tsx`
6. Overview cards → `src/components/Overview.tsx`
7. Activity heatmap → `src/components/ActivityHeatmap.tsx`
8. People breakdown → `src/components/PeopleBreakdown.tsx`
9. Emoji wall → `src/components/EmojiWall.tsx`
10. Word cloud → `src/components/WordCloud.tsx`
11. Timeline → `src/components/Timeline.tsx`
12. Dashboard layout → `src/components/Dashboard.tsx`
13. App shell → `src/App.tsx`
14. PWA manifest → `vite.config.ts` / `public/manifest.json`

## Test Cases

**Input:** 3-person WhatsApp chat over 30 days, ~500 messages
**Expected:**
- Overview: Shows 3 participants, ~500 messages, date range spans 30 days
- Heatmap: Busy hour correctly peaks (e.g., 8-10 PM)
- People: Correct message count per person (sum == total)
- Emoji wall: Top emoji matches manual count
- Streaks: Longest streak matches consecutive days with messages
