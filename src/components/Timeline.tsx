import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

// Common type for all timeline data points
interface TimelineDataPoint {
  label: string;
  count: number;
}

export default function Timeline({ analysis }: Props) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const timelineData = useMemo(() => {
    const days = Object.entries(analysis.messagesPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
        label: formatDisplayDate(date),
      }));
    return days;
  }, [analysis.messagesPerDay]);

  const busiestDay = useMemo(() => {
    if (timelineData.length === 0) return null;
    return timelineData.reduce((max, curr) =>
      curr.count > max.count ? curr : max
    );
  }, [timelineData]);

  const { weeklyData, monthlyData } = useMemo(() => {
    const weekly: Record<string, { count: number; days: number }> = {};
    const monthly: Record<string, { count: number; days: number }> = {};

    for (const [date, count] of Object.entries(analysis.messagesPerDay)) {
      const d = new Date(date + 'T00:00:00');
      const weekStart = getWeekStart(d);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weekly[weekKey]) weekly[weekKey] = { count: 0, days: 0 };
      weekly[weekKey].count += count;
      weekly[weekKey].days += 1;

      const monthKey = date.substring(0, 7);
      if (!monthly[monthKey]) monthly[monthKey] = { count: 0, days: 0 };
      monthly[monthKey].count += count;
      monthly[monthKey].days += 1;
    }

    return {
      weeklyData: Object.entries(weekly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, data]) => ({
          label: formatDisplayDate(label),
          count: data.count,
          avg: Math.round(data.count / data.days),
        })),
      monthlyData: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, data]) => ({
          label,
          count: data.count,
          avg: Math.round(data.count / data.days),
        })),
    };
  }, [analysis.messagesPerDay]);

  const chartData: TimelineDataPoint[] = viewMode === 'daily'
    ? timelineData
    : viewMode === 'weekly'
      ? weeklyData
      : monthlyData;

  return (
    <div>
      <h2 className="ch-section-head text-2xl mb-4">Timeline</h2>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
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

      {/* Chart */}
      <div className="ch-card p-5 mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
              formatter={(value) => [Number(value).toLocaleString(), 'Messages']}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
              dot={viewMode !== 'daily' || chartData.length < 60}
              activeDot={{ r: 5, fill: '#f59e0b' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ch-card p-4">
          <p className="text-xs text-chatter-text-muted mb-1">Longest Streak</p>
          <p className="text-xl font-bold text-chatter-text">
            {analysis.streaks.longest} days{' '}
            <span>🔥</span>
          </p>
        </div>

        {busiestDay && (
          <div className="ch-card p-4">
            <p className="text-xs text-chatter-text-muted mb-1">Busiest Day</p>
            <p className="text-xl font-bold text-chatter-text">
              {busiestDay.count.toLocaleString()} msgs
            </p>
            <p className="text-xs text-chatter-text-muted">{busiestDay.label}</p>
          </div>
        )}

        {analysis.streaks.current !== undefined && (
          <div className="ch-card p-4">
            <p className="text-xs text-chatter-text-muted mb-1">Current Streak</p>
            <p className="text-xl font-bold text-chatter-text">
              {analysis.streaks.current} days{' '}
              {analysis.streaks.current >= 3 && <span>🔥</span>}
            </p>
          </div>
        )}
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
