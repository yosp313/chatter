import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ChatAnalysis } from '../types';
import { PARTICIPANT_COLORS } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

export default function EmojiWall({ analysis }: Props) {
  const topEmojis = useMemo(
    () => analysis.emojiStats.slice(0, 20),
    [analysis.emojiStats]
  );

  const maxCount = useMemo(
    () => (topEmojis.length > 0 ? topEmojis[0].count : 1),
    [topEmojis]
  );

  return (
    <div>
      <h2 className="ch-section-head text-2xl mb-6">Emoji Wall</h2>

      {/* Top emoji grid - size = frequency */}
      <div className="bg-chatter-card rounded-xl p-6 border border-chatter-border mb-6">
        <h3 className="text-sm font-medium text-chatter-text-muted mb-4">
          Top 20 Emojis
        </h3>
        <div className="flex flex-wrap gap-3 items-end justify-center min-h-[120px]">
          {topEmojis.map((stat, i) => {
            const size = 0.6 + (stat.count / maxCount) * 1.6;
            return (
              <motion.div
                key={stat.emoji + i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.03,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className="flex flex-col items-center gap-1"
                title={`${stat.emoji}: used ${stat.count} times`}
              >
                <span
                  style={{ fontSize: `${size}rem` }}
                  className="leading-none"
                >
                  {stat.emoji}
                </span>
                <span className="text-[10px] text-chatter-text-muted">
                  {stat.count}
                </span>
              </motion.div>
            );
          })}
          {topEmojis.length === 0 && (
            <p className="text-chatter-text-muted text-sm">No emojis found</p>
          )}
        </div>
      </div>

      {/* Emoji usage per person */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {analysis.participants.map((sender) => {
          const senderEmojis = analysis.emojiStats
            .filter((s) => s.sender === sender)
            .slice(0, 8);

          if (senderEmojis.length === 0) return null;

          return (
            <div
              key={sender}
              className="ch-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      PARTICIPANT_COLORS[
                        analysis.participants.indexOf(sender) %
                          PARTICIPANT_COLORS.length
                      ],
                  }}
                />
                <h3 className="font-semibold text-chatter-text text-sm">{sender}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {senderEmojis.map((s) => (
                  <span
                    key={s.emoji}
                    className="flex items-center gap-1 px-2 py-1 bg-chatter-bg rounded-md"
                    title={`${s.emoji}: ${s.count} times`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-xs text-chatter-text-muted">{s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
