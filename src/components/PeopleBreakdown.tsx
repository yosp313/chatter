import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChatAnalysis } from '../types';
import { PARTICIPANT_COLORS } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

export default function PeopleBreakdown({ analysis }: Props) {
  const barData = useMemo(() => {
    return analysis.participants.map((name, i) => ({
      name,
      messages: analysis.messagesBySender[name] || 0,
      words: analysis.wordsBySender[name] || 0,
      emojis: analysis.emojisBySender[name] || 0,
      media: analysis.mediaBySender[name] || 0,
      avgLength: analysis.avgMessageLength[name] || 0,
      color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
    }));
  }, [analysis]);

  const totalMessages = analysis.totalMessages;

  return (
    <div>
      <h2 className="text-2xl font-bold text-chatter-text mb-6">People</h2>

      {/* Bar Chart */}
      <div className="bg-chatter-card rounded-xl p-5 border border-chatter-border mb-6">
        <h3 className="text-sm font-medium text-chatter-text-muted mb-4">
          Messages per Person
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 60)}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#e2e8f0', fontSize: 13 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              formatter={(value) => [Number(value).toLocaleString(), 'Messages']}
            />
            <Bar dataKey="messages" radius={[0, 6, 6, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-person detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {barData.map((person, i) => (
          <motion.div
            key={person.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-chatter-card rounded-xl p-5 border border-chatter-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: person.color }}
              />
              <h3 className="font-semibold text-chatter-text">{person.name}</h3>
              <span className="text-xs text-chatter-text-muted ml-auto">
                {((person.messages / totalMessages) * 100).toFixed(1)}% of all messages
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-chatter-text-muted">Messages</p>
                <p className="text-lg font-bold text-chatter-text">
                  {person.messages.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-chatter-text-muted">Words</p>
                <p className="text-lg font-bold text-chatter-text">
                  {person.words.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-chatter-text-muted">Emojis</p>
                <p className="text-lg font-bold text-chatter-text">
                  {person.emojis.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-chatter-text-muted">Avg. Length</p>
                <p className="text-lg font-bold text-chatter-text">
                  {person.avgLength} chars
                </p>
              </div>
              {person.media > 0 && (
                <div>
                  <p className="text-xs text-chatter-text-muted">Media</p>
                  <p className="text-lg font-bold text-chatter-text">
                    {person.media.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
