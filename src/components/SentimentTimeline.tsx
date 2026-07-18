import { useState, useMemo } from 'react';
import {
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

export default function SentimentTimeline({ analysis }: Props) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const chartData = useMemo(() => {
    const days = Object.keys(analysis.messagesPerDay).sort();
    const data = days.map((date) => ({
      label: formatDisplayDate(date),
      date,
      sentiment: analysis.sentimentPerDay[date] || 0,
      messages: analysis.messagesPerDay[date] || 0,
    }));
    return data;
  }, [analysis.messagesPerDay, analysis.sentimentPerDay]);

  const weeklyData = useMemo(() => {
    const weeks: Record<string, { sentiment: number; messages: number; days: number }> = {};
    for (const point of chartData) {
      const d = new Date(point.date + 'T00:00:00');
      const weekStart = getWeekStart(d);
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { sentiment: 0, messages: 0, days: 0 };
      weeks[key].sentiment += point.sentiment;
      weeks[key].messages += point.messages;
      weeks[key].days += 1;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        label: formatDisplayDate(date),
        date,
        sentiment: Math.round((d.sentiment / d.days) * 100) / 100,
        messages: d.messages,
      }));
  }, [chartData]);

  const data = viewMode === 'weekly' ? weeklyData : chartData;

  // Stats
  const avgSentiment = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((s, d) => s + d.sentiment, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }, [data]);

  const mostPositive = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, curr) => (curr.sentiment > max.sentiment ? curr : max));
  }, [data]);

  const mostNegative = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((min, curr) => (curr.sentiment < min.sentiment ? curr : min));
  }, [data]);

  const sentimentColor =
    analysis.sentimentTrend === 'up'
      ? '#10b981'
      : analysis.sentimentTrend === 'down'
        ? '#ef4444'
        : '#f59e0b';

  return (
    <div>
      <h2 className="text-2xl font-bold text-chatter-text mb-2">Sentiment Timeline</h2>
      <p className="text-sm text-chatter-text-muted mb-6">
        Message mood over time based on word choice (no AI — pure wordlist analysis).
        Everything stays in your browser.
      </p>

      {/* Trend badge */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          {(['daily', 'weekly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                viewMode === mode
                  ? 'bg-chatter-accent text-black'
                  : 'bg-chatter-card text-chatter-text-muted border border-chatter-border hover:border-chatter-accent/50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-xs text-chatter-text-muted">|</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-chatter-text-muted">Trend:</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${sentimentColor}15`,
              color: sentimentColor,
            }}
          >
            {analysis.sentimentTrend === 'up' && '📈 Improving'}
            {analysis.sentimentTrend === 'down' && '📉 Declining'}
            {analysis.sentimentTrend === 'stable' && '➡️ Stable'}
          </span>
          <span className="text-xs text-chatter-text-muted ml-2">
            Avg: {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Combined chart: bars for messages + line for sentiment */}
      <div className="bg-chatter-card rounded-xl p-5 border border-chatter-border mb-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              label={{
                value: 'Messages',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 11,
                style: { textAnchor: 'middle' },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              domain={['auto', 'auto']}
              label={{
                value: 'Sentiment',
                angle: 90,
                position: 'insideRight',
                fill: '#94a3b8',
                fontSize: 11,
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: unknown) => {
                if (name === 'sentiment') return [typeof value === 'number' ? (value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)) : String(value), 'Sentiment'];
                return [typeof value === 'number' ? Number(value).toLocaleString() : String(value), 'Messages'];
              }}
              labelFormatter={(label) => String(label)}
            />
            <ReferenceLine
              yAxisId="right"
              y={0}
              stroke="#4a4a6a"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Bar
              yAxisId="left"
              dataKey="messages"
              fill="#2a2a5a"
              radius={[2, 2, 0, 0]}
              opacity={0.5}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="sentiment"
              stroke={sentimentColor}
              strokeWidth={2}
              fill={sentimentColor}
              fillOpacity={0.1}
              dot={data.length < 30}
              activeDot={{ r: 5, fill: sentimentColor }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-chatter-card rounded-xl p-4 border border-chatter-border">
          <p className="text-xs text-chatter-text-muted mb-1">Average Sentiment</p>
          <p
            className="text-xl font-bold"
            style={{
              color: avgSentiment > 0 ? '#10b981' : avgSentiment < 0 ? '#ef4444' : '#e2e8f0',
            }}
          >
            {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
          </p>
          <p className="text-xs text-chatter-text-muted mt-1">
            {avgSentiment > 0.5
              ? 'Very positive chat ☀️'
              : avgSentiment > 0.1
                ? 'Generally positive 😊'
                : avgSentiment > -0.1
                  ? 'Neutral 😐'
                  : avgSentiment > -0.5
                    ? 'Slightly negative 🌧️'
                    : 'Very negative 😟'}
          </p>
        </div>

        {mostPositive && (
          <div className="bg-chatter-card rounded-xl p-4 border border-chatter-border">
            <p className="text-xs text-chatter-text-muted mb-1">Most Positive Day</p>
            <p className="text-xl font-bold text-emerald-400">
              +{mostPositive.sentiment.toFixed(2)}
            </p>
            <p className="text-xs text-chatter-text-muted">{mostPositive.label}</p>
          </div>
        )}

        {mostNegative && (
          <div className="bg-chatter-card rounded-xl p-4 border border-chatter-border">
            <p className="text-xs text-chatter-text-muted mb-1">Most Negative Day</p>
            <p className="text-xl font-bold text-red-400">
              {mostNegative.sentiment.toFixed(2)}
            </p>
            <p className="text-xs text-chatter-text-muted">{mostNegative.label}</p>
          </div>
        )}
      </div>

      {/* Methodology note */}
      <div className="mt-6 bg-chatter-card/50 rounded-xl p-4 border border-chatter-border">
        <p className="text-xs text-chatter-text-muted/60 leading-relaxed">
          Sentiment analysis uses a wordlist (AFINN-based) of 150+ scored words.
          Scores range from -3 (negative) to +4 (positive). Negations like "not",
          "never" flip the next sentiment word. Emojis with strong sentiment are
          also scored. This runs entirely in your browser — no data sent anywhere.
        </p>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
