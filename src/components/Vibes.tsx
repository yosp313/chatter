import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

const PARTICIPANT_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f97316', '#6366f1', '#06b6d4', '#eab308',
];

const LATE_NIGHT_LABELS = ['🌙 Night Owl', '🦉 Up Late', '🌃 Midnight Crew', '☕ Insomniac'];

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Vibes({ analysis }: Props) {
  const [activeView, setActiveView] = useState<'stats' | 'roast'>('roast');
  const [roastPerson, setRoastPerson] = useState<string>('all');
  const cardRef = useRef<HTMLDivElement>(null);
  const a = analysis;

  const lateNightPct = Math.round(a.lateNightFraction * 100);
  const lateNightLabel = LATE_NIGHT_LABELS[Math.min(Math.floor(lateNightPct / 25), 3)];

  // Sort participants by various metrics
  const sortedByDoubleText = useMemo(() =>
    Object.entries(a.doubleTexters).sort((a, b) => b[1] - a[1]),
    [a.doubleTexters]
  );

  const sortedByInitiative = useMemo(() =>
    Object.entries(a.pickMeIndex)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]),
    [a.pickMeIndex]
  );

  const sortedByMessages = useMemo(() =>
    Object.entries(a.messagesBySender).sort((a, b) => b[1] - a[1]),
    [a.messagesBySender]
  );

  // Generate roast text per person
  function generateRoast(person?: string) {
    const p = person || sortedByMessages[0]?.[0] || 'this chat';
    const pMsgs = a.messagesBySender[p] || 0;
    const pDouble = a.doubleTexters[p] || 0;
    const pPickMe = a.pickMeIndex[p] || 0;
    const pEmoji = a.uniqueEmojiScore[p] || '—';
    const pSent = a.emojisBySender[p] || 0;
    const pMedia = a.mediaBySender[p] || 0;
    const pWords = a.wordsBySender[p] || 0;
    const isTopTalker = sortedByMessages[0]?.[0] === p;
    const rank = sortedByMessages.findIndex(([n]) => n === p) + 1;
    const total = sortedByMessages.length;

    const lines: string[] = [];

    // Opening
    if (isTopTalker) {
      lines.push(`👑 ${p} ran this chat.`);
      lines.push(`${pMsgs.toLocaleString()} messages — basically a full-time job.`);
    } else {
      lines.push(`${p} is #${rank} of ${total} with ${pMsgs.toLocaleString()} messages.`);
    }

    // Late night
    if (lateNightPct > 30) lines.push(`🌙 ${lateNightPct}% of messages sent after midnight. Sleep is optional.`);
    else if (lateNightPct > 15) lines.push(`🌙 ${lateNightPct}% late-night activity — normal person hours.`);

    // Double text
    if (pDouble > 10) lines.push(`👀 ${pDouble} double texts. We saw you.`);
    else if (pDouble > 0) lines.push(`👀 ${pDouble} double texts — mild.`);

    // Initiative
    if (pPickMe > 0.3) lines.push(`💀 "So anyway..." — ${p} starts ${Math.round(pPickMe * 100)}% of conversations.`);
    else if (pPickMe > 0.1) lines.push(`💬 ${p} lets others start, then slides in. Strategic.`);
    else lines.push(`🫥 ${p} just replies. Never starts. Ghost energy.`);

    // Emoji personality
    if (pEmoji !== '—') lines.push(`🎭 Signature emoji: ${pEmoji} (×${a.emojiStats.find(e => e.emoji === pEmoji)?.count || '?'}). It's their brand.`);

    // Words per message
    const avgW = pMsgs > 0 ? Math.round(pWords / pMsgs) : 0;
    if (avgW > 30) lines.push(`📖 Average message: ${avgW} words. Writing a novel every reply.`);
    else if (avgW < 8) lines.push(`📝 ${avgW} words per message on average. Short king energy.`);

    // Media
    if (pMedia > 20) lines.push(`📸 ${pMedia} media messages. The group paparazzo.`);
    else if (pMedia === 0) lines.push(`📸 Zero media sent. No pics, no vids, just vibes.`);

    // Response time
    const rt = a.responseTimes.perPerson[p];
    if (rt) {
      if (rt.avgSeconds < 120) lines.push(`⚡ Replies in ${Math.round(rt.avgSeconds / 60)}m on average. Phone is glued to hand.`);
      else if (rt.avgSeconds < 600) lines.push(`⏰ Average reply: ${Math.round(rt.avgSeconds / 60)}m. Reasonable. Respectable.`);
      else lines.push(`🐢 Average reply: ${(rt.avgSeconds / 3600).toFixed(1)}h. They'll get back to you. Eventually.`);
    }

    // Ghosted
    if (rt && rt.ghosted > 3) lines.push(`👻 Left ${rt.ghosted} messages on read. Certified ghoster.`);

    // Streak
    if (a.streaks.longest > 10) lines.push(`🔥 ${a.streaks.longest}-day streak. Commitment issues? Not with this chat.`);

    // Emoji count
    if (a.totalEmojis > 0) {
      const pct = pMsgs > 0 ? Math.round((pSent / pMsgs) * 100) : 0;
      if (pct > 80) lines.push(`😊 ${pct}% of messages have emojis. Can't express without a glyph.`);
      else if (pct < 10) lines.push(`😐 ${pct}% emoji rate. Emotionally reserved.`);
    }

    // Final score
    const score = Math.min(Math.round(
      (pMsgs / Math.max(...Object.values(a.messagesBySender))) * 40 +
      (lateNightPct > 30 ? 20 : 10) +
      (pDouble > 5 ? 10 : 5) +
      (rt?.avgSeconds && rt.avgSeconds < 300 ? 15 : 5) +
      (a.streaks.longest > 5 ? 15 : 5)
    ), 99);

    lines.push(`\n📊 Chat Personality Score: ${score}/99`);

    return lines.join('\n');
  }

  const roastText = roastPerson === 'all'
    ? sortedByMessages.map(([name]) => generateRoast(name)).join('\n\n━━━━━━━━━━━━━━━━\n\n')
    : generateRoast(roastPerson);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const blob = await toBlob(cardRef.current, {
        backgroundColor: '#0f0f1a',
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      if (!blob) throw new Error('Failed to generate image');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `chat-roast-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="ch-section-head text-2xl">Chat Vibes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView(activeView === 'roast' ? 'stats' : 'roast')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-chatter-card border border-chatter-border text-chatter-text hover:border-chatter-accent/50 transition-colors"
          >
            {activeView === 'roast' ? '📊 Show Stats' : '🔥 Show Roast'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-chatter-accent rounded-lg hover:bg-chatter-accent/90 transition-colors ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{downloading ? '⏳' : '⬇️'}</span> {downloading ? 'Generating...' : 'Download'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'stats' ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Fun stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="ch-card p-5"
              >
                <p className="text-xs text-chatter-text-muted mb-1">🌙 Late Night Index</p>
                <p className="ch-num text-3xl font-bold text-chatter-accent">{lateNightPct}%</p>
                <p className="text-xs text-chatter-text-muted mt-1">{lateNightLabel}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="ch-card p-5"
              >
                <p className="text-xs text-chatter-text-muted mb-1">👀 Most Double Texts</p>
                <p className="ch-num text-3xl font-bold text-chatter-text truncate">
                  {sortedByDoubleText[0]?.[0] || '—'}
                </p>
                <p className="text-xs text-chatter-text-muted mt-1">
                  {sortedByDoubleText[0]?.[1] || 0} times
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="ch-card p-5"
              >
                <p className="text-xs text-chatter-text-muted mb-1">💀 Conversation Starter</p>
                <p className="ch-num text-3xl font-bold text-chatter-text truncate">
                  {sortedByInitiative[0]?.[0] || '—'}
                </p>
                <p className="text-xs text-chatter-text-muted mt-1">
                  Starts {sortedByInitiative[0]?.[1] ? Math.round(sortedByInitiative[0][1] * 100) : 0}% of days
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="ch-card p-5"
              >
                <p className="text-xs text-chatter-text-muted mb-1">🔥 Streak Score</p>
                <p className="ch-num text-3xl font-bold text-chatter-accent">{a.streaks.longest} days</p>
                <p className="text-xs text-chatter-text-muted mt-1">
                  {a.streaks.current ? `${a.streaks.current} day current!` : 'Not currently active'}
                </p>
              </motion.div>
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Double Text Leaderboard */}
              <div className="bg-chatter-card rounded-xl border border-chatter-border overflow-hidden">
                <div className="px-5 py-4 border-b border-chatter-border">
                  <h3 className="text-sm font-semibold text-chatter-text">👀 Double Text Leaderboard</h3>
                </div>
                <div className="p-3">
                  {sortedByDoubleText.length === 0 ? (
                    <p className="text-sm text-chatter-text-muted px-3 py-4 text-center">No double texters here</p>
                  ) : (
                    sortedByDoubleText.slice(0, 6).map(([name, count], i) => {
                      const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                      return (
                        <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                          <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                          <span className="text-sm font-medium flex-1" style={{ color }}>{name}</span>
                          <span className="text-sm font-mono text-chatter-text-muted">{count}x</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Conversation Starter Leaderboard */}
              <div className="bg-chatter-card rounded-xl border border-chatter-border overflow-hidden">
                <div className="px-5 py-4 border-b border-chatter-border">
                  <h3 className="text-sm font-semibold text-chatter-text">💬 "So Anyway..." Leaders</h3>
                </div>
                <div className="p-3">
                  {sortedByInitiative.length === 0 ? (
                    <p className="text-sm text-chatter-text-muted px-3 py-4 text-center">Not enough data</p>
                  ) : (
                    sortedByInitiative.slice(0, 6).map(([name, ratio], i) => {
                      const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                      return (
                        <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                          <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                          <span className="text-sm font-medium flex-1" style={{ color }}>{name}</span>
                          <span className="text-sm font-mono text-chatter-text-muted">{Math.round(ratio * 100)}%</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Per-person cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedByMessages.map(([name, msgs], i) => {
                const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                const emoji = a.uniqueEmojiScore[name] || '💬';
                const pickMe = a.pickMeIndex[name] || 0;
                const doubleT = a.doubleTexters[name] || 0;
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="ch-card p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold" style={{ color }}>{name}</p>
                      <span className="text-xl">{emoji}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-chatter-bg/50 rounded-lg p-2">
                        <p className="text-chatter-text-muted mb-0.5">Messages</p>
                        <p className="text-sm font-bold text-chatter-text">{msgs.toLocaleString()}</p>
                      </div>
                      <div className="bg-chatter-bg/50 rounded-lg p-2">
                        <p className="text-chatter-text-muted mb-0.5">Initiative</p>
                        <p className="text-sm font-bold text-chatter-text">{Math.round(pickMe * 100)}%</p>
                      </div>
                      <div className="bg-chatter-bg/50 rounded-lg p-2">
                        <p className="text-chatter-text-muted mb-0.5">Double</p>
                        <p className="text-sm font-bold text-chatter-text">{doubleT}x</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="roast"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Roast Card */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <select
                value={roastPerson}
                onChange={(e) => setRoastPerson(e.target.value)}
                className="px-4 py-2 rounded-lg bg-chatter-card border border-chatter-border text-chatter-text text-sm"
              >
                <option value="all">🔥 Roast Everyone</option>
                {sortedByMessages.map(([name]) => (
                  <option key={name} value={name}>🔥 Roast {name}</option>
                ))}
              </select>
            </div>

            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl border border-chatter-border mx-auto"
              style={{ width: '100%', maxWidth: 520, minHeight: 600 }}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-chatter-bg to-rose-900/20" />

              {/* Deco */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-chatter-accent/5 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl" />

              {/* Content */}
              <div className="relative z-10 px-8 py-10">
                <div className="text-center mb-8">
                  <span className="text-5xl block mb-3">🔥</span>
                  <h2 className="text-2xl font-bold text-chatter-accent">Chat Roast</h2>
                  <p className="text-xs text-chatter-text-muted mt-1">
                    {a.participants.join(', ')} · {fmtDate(a.dateRange.start)} – {fmtDate(a.dateRange.end)}
                  </p>
                </div>

                <pre className="text-sm text-chatter-text leading-relaxed whitespace-pre-wrap font-sans">
                  {roastText}
                </pre>

                <div className="mt-8 pt-4 border-t border-chatter-border text-center">
                  <p className="text-xs text-chatter-text-muted/30">Generated by Chatter · All data stays local</p>
                </div>
              </div>
            </div>

            {/* Individual roast cards for each person */}
            {roastPerson === 'all' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {sortedByMessages.slice(0, 6).map(([name], i) => {
                  const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                  const emoji = a.uniqueEmojiScore[name] || '💬';
                  const lines: string[] = [];

                  const pDouble = a.doubleTexters[name] || 0;
                  const pPickMe = a.pickMeIndex[name] || 0;
                  const rt = a.responseTimes.perPerson[name];

                  if (pDouble > 5) lines.push(`👀 ${pDouble}x double text`);
                  if (pPickMe > 0.25) lines.push(`💀 Starts convos`);
                  if (rt) {
                    if (rt.avgSeconds < 120) lines.push(`⚡ Fast replies`);
                    else if (rt.avgSeconds > 3600) lines.push(`🐢 Slow replies`);
                  }
                  if (a.streaks.longest > 7) lines.push(`🔥 Dedicated`);

                  return (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="ch-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{emoji}</span>
                        <p className="text-sm font-bold" style={{ color }}>{name}</p>
                      </div>
                      <p className="text-xs text-chatter-text-muted leading-relaxed">
                        {lines.length > 0 ? lines.join(' · ') : 'No standout stats'}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
