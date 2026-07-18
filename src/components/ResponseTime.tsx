import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

const PARTICIPANT_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f97316', '#6366f1', '#06b6d4', '#eab308',
];

function fmt(seconds: number): string {
  if (seconds === 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

function fmtShort(seconds: number): string {
  if (seconds === 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function ResponseTime({ analysis }: Props) {
  const { responseTimes: rt } = analysis;

  const sortedPeople = useMemo(() => {
    return Object.entries(rt.perPerson)
      .filter(([, s]) => s.avgSeconds > 0)
      .sort((a, b) => a[1].avgSeconds - b[1].avgSeconds);
  }, [rt.perPerson]);

  const maxTime = sortedPeople.length > 0
    ? Math.max(...sortedPeople.map(([, s]) => s.avgSeconds), 1)
    : 1;

  return (
    <div>
      <h2 className="ch-section-head text-2xl mb-2">Response Times</h2>
      <p className="text-sm text-chatter-text-muted mb-6">
        How fast does everyone reply? Measured from the last message to the next
        when the sender changes. Gaps over 7 days are excluded.
      </p>

      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ch-card p-5"
        >
          <p className="text-xs text-chatter-text-muted mb-1">⚡ Avg Reply Time</p>
          <p className="ch-num text-3xl font-bold text-chatter-accent">{fmt(rt.overall.avgSeconds)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ch-card p-5"
        >
          <p className="text-xs text-chatter-text-muted mb-1">🏆 Fastest</p>
          <p className="ch-num text-3xl font-bold text-emerald-400">
            {rt.fastest.name !== '—' ? rt.fastest.name : '—'}
          </p>
          <p className="text-xs text-chatter-text-muted mt-1">
            {rt.fastest.name !== '—' ? fmt(rt.fastest.avgSeconds) : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ch-card p-5"
        >
          <p className="text-xs text-chatter-text-muted mb-1">🐢 Slowest</p>
          <p className="ch-num text-3xl font-bold text-red-400">
            {rt.slowest.name !== '—' ? rt.slowest.name : '—'}
          </p>
          <p className="text-xs text-chatter-text-muted mt-1">
            {rt.slowest.name !== '—' ? fmt(rt.slowest.avgSeconds) : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="ch-card p-5"
        >
          <p className="text-xs text-chatter-text-muted mb-1">👻 Ghosted</p>
          <p className="ch-num text-3xl font-bold text-chatter-text">
            {rt.overall.ghosted > 0 ? `${rt.overall.ghosted}x` : '0'}
          </p>
          <p className="text-xs text-chatter-text-muted mt-1">
            {rt.overall.ghosted > 0 ? 'Messages left on read >24h' : 'No ghosting here!'}
          </p>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <div className="bg-chatter-card rounded-xl border border-chatter-border overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-chatter-border">
          <h3 className="text-sm font-semibold text-chatter-text">Reply Speed Leaderboard</h3>
        </div>
        <div className="p-2">
          {sortedPeople.length === 0 ? (
            <p className="text-sm text-chatter-text-muted px-3 py-4 text-center">
              Not enough data — need at least 2 people replying to each other.
            </p>
          ) : (
            sortedPeople.map(([name, stats], i) => {
              const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
              const barWidth = Math.max((1 - stats.avgSeconds / maxTime) * 70 + 20, 5);

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-chatter-bg/50 transition-colors"
                >
                  {/* Rank */}
                  <span className="w-6 text-sm font-bold text-chatter-text-muted text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>

                  {/* Name */}
                  <span className="w-24 sm:w-32 text-sm font-medium text-chatter-text truncate" style={{ color }}>
                    {name}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-5 bg-chatter-bg rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>

                  {/* Time */}
                  <span className="w-16 text-right text-sm font-mono text-chatter-text-muted">
                    {fmtShort(stats.avgSeconds)}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Best / Worst Pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="ch-card p-5">
          <h3 className="text-sm font-semibold text-chatter-text mb-3">⚡ Fastest Pair</h3>
          {rt.bestPair.from !== '—' ? (
            <div>
              <p className="text-lg font-bold text-emerald-400">
                {rt.bestPair.from} → {rt.bestPair.to}
              </p>
              <p className="text-sm text-chatter-text-muted mt-1">
                Avg reply: {fmt(rt.bestPair.avgSeconds)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-chatter-text-muted">Not enough data</p>
          )}
        </div>

        <div className="ch-card p-5">
          <h3 className="text-sm font-semibold text-chatter-text mb-3">🐢 Slowest Pair</h3>
          {rt.worstPair.from !== '—' ? (
            <div>
              <p className="text-lg font-bold text-red-400">
                {rt.worstPair.from} → {rt.worstPair.to}
              </p>
              <p className="text-sm text-chatter-text-muted mt-1">
                Avg reply: {fmt(rt.worstPair.avgSeconds)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-chatter-text-muted">Not enough data</p>
          )}
        </div>
      </div>

      {/* Detailed per-person cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPeople.map(([name, stats], i) => {
          const color = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="ch-card p-4"
            >
              <p className="text-sm font-bold mb-2" style={{ color }}>{name}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-chatter-text-muted">Avg</p>
                  <p className="text-sm font-mono text-chatter-text">{fmtShort(stats.avgSeconds)}</p>
                </div>
                <div>
                  <p className="text-xs text-chatter-text-muted">Med</p>
                  <p className="text-sm font-mono text-chatter-text">{fmtShort(stats.medianSeconds)}</p>
                </div>
                <div>
                  <p className="text-xs text-chatter-text-muted">Fastest</p>
                  <p className="text-sm font-mono text-chatter-text">{fmtShort(stats.minSeconds)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
