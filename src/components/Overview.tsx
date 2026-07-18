import { motion } from 'framer-motion';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

export default function Overview({ analysis }: Props) {
  const days = Math.round(
    (analysis.dateRange.end.getTime() - analysis.dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

  const cards = [
    {
      label: 'Total Messages',
      value: analysis.totalMessages.toLocaleString(),
      icon: '💬',
      color: 'from-amber-500/20 to-amber-600/10',
    },
    {
      label: 'Total Words',
      value: analysis.totalWords.toLocaleString(),
      icon: '📝',
      color: 'from-emerald-500/20 to-emerald-600/10',
    },
    {
      label: 'Total Emojis',
      value: analysis.totalEmojis.toLocaleString(),
      icon: '😊',
      color: 'from-pink-500/20 to-pink-600/10',
    },
    {
      label: 'Media Shared',
      value: analysis.totalMedia.toLocaleString(),
      icon: '📸',
      color: 'from-blue-500/20 to-blue-600/10',
    },
    {
      label: 'Participants',
      value: analysis.participants.length.toString(),
      icon: '👥',
      color: 'from-violet-500/20 to-violet-600/10',
    },
    {
      label: 'Days Active',
      value: days.toLocaleString(),
      icon: '📅',
      color: 'from-cyan-500/20 to-cyan-600/10',
    },
    {
      label: 'Longest Streak',
      value: `${analysis.streaks.longest} days`,
      icon: '🔥',
      color: 'from-orange-500/20 to-orange-600/10',
    },
    {
      label: 'Total Missed',
      value: Object.keys(analysis.messagesPerDay).length.toLocaleString(),
      icon: '📊',
      color: 'from-teal-500/20 to-teal-600/10',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-chatter-text mb-6">Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-chatter-card rounded-xl p-5 border border-chatter-border hover:border-chatter-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-chatter-text-muted text-sm mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-chatter-text">{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 bg-chatter-card rounded-xl p-5 border border-chatter-border">
        <p className="text-chatter-text-muted text-sm">
          Chat from{' '}
          <span className="text-chatter-text font-medium">
            {analysis.dateRange.start.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>{' '}
          to{' '}
          <span className="text-chatter-text font-medium">
            {analysis.dateRange.end.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </p>
      </div>
    </div>
  );
}
