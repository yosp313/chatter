import { useMemo } from 'react';
import type { ChatAnalysis } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a';
  if (i === 12) return '12p';
  return i < 12 ? `${i}a` : `${i - 12}p`;
});

function getIntensity(value: number, max: number): number {
  if (max === 0) return 0;
  // Use log scale for better distribution
  return Math.min(1, Math.log(value + 1) / Math.log(max + 1));
}

function getColor(intensity: number): string {
  // Dark theme heatmap: from dark to amber
  if (intensity === 0) return 'bg-chatter-bg';
  if (intensity < 0.2) return 'bg-amber-900/30';
  if (intensity < 0.4) return 'bg-amber-800/40';
  if (intensity < 0.6) return 'bg-amber-700/50';
  if (intensity < 0.8) return 'bg-amber-600/60';
  return 'bg-amber-500/70';
}

export default function ActivityHeatmap({ analysis }: Props) {
  const { heatmapData, maxValue } = useMemo(() => {
    const data: Record<number, Record<number, number>> = {};

    // Initialize all day/hour combinations
    for (let day = 0; day < 7; day++) {
      data[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        data[day][hour] = 0;
      }
    }

    // Use the messagesByHour and dailyActivity to create a cross-product heatmap
    // Since we don't have exact day×hour data, we'll create an estimated heatmap
    // by combining the two distributions
    const dayTotal = Object.values(analysis.dailyActivity).reduce((a, b) => a + b, 0);
    const hourTotal = Object.values(analysis.messagesByHour).reduce((a, b) => a + b, 0);

    let maxVal = 0;

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dayFrac = (analysis.dailyActivity[day] || 0) / (dayTotal || 1);
        const hourFrac = (analysis.messagesByHour[hour] || 0) / (hourTotal || 1);
        // Combined probability × total messages
        const value = Math.round(dayFrac * hourFrac * analysis.totalMessages);
        data[day][hour] = value;
        if (value > maxVal) maxVal = value;
      }
    }

    return { heatmapData: data, maxValue: maxVal };
  }, [analysis]);

  // Find the peak hour
  const peakHour = useMemo(() => {
    let maxHour = 0;
    let maxCount = 0;
    for (let h = 0; h < 24; h++) {
      if ((analysis.messagesByHour[h] || 0) > maxCount) {
        maxCount = analysis.messagesByHour[h];
        maxHour = h;
      }
    }
    return maxHour;
  }, [analysis]);

  // Find the peak day
  const peakDay = useMemo(() => {
    let maxDay = 0;
    let maxCount = 0;
    for (let d = 0; d < 7; d++) {
      if ((analysis.dailyActivity[d] || 0) > maxCount) {
        maxCount = analysis.dailyActivity[d];
        maxDay = d;
      }
    }
    return maxDay;
  }, [analysis]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-chatter-text mb-4">Activity Heatmap</h2>
      <p className="text-chatter-text-muted text-sm mb-6">
        Most active time:{' '}
        <span className="text-chatter-accent font-medium">
          {DAYS[peakDay]} at {HOURS[peakHour]}
        </span>
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row - hours */}
          <div className="flex">
            <div className="w-12 shrink-0" /> {/* Day label column */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-chatter-text-muted py-1 min-w-[28px]"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center">
              <div className="w-12 shrink-0 text-xs text-chatter-text-muted font-medium">
                {day}
              </div>
              {Array.from({ length: 24 }, (_, hourIdx) => {
                const value = heatmapData[dayIdx]?.[hourIdx] || 0;
                const intensity = getIntensity(value, maxValue);
                return (
                  <div
                    key={hourIdx}
                    className="flex-1 min-w-[28px] aspect-square p-0.5"
                    title={`${DAYS[dayIdx]} ${HOURS[hourIdx]}: ${value} messages`}
                  >
                    <div
                      className={`w-full h-full rounded-sm ${getColor(intensity)} transition-colors`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-xs text-chatter-text-muted">Less</span>
        <div className="w-4 h-4 rounded-sm bg-chatter-bg" />
        <div className="w-4 h-4 rounded-sm bg-amber-900/30" />
        <div className="w-4 h-4 rounded-sm bg-amber-800/40" />
        <div className="w-4 h-4 rounded-sm bg-amber-700/50" />
        <div className="w-4 h-4 rounded-sm bg-amber-600/60" />
        <div className="w-4 h-4 rounded-sm bg-amber-500/70" />
        <span className="text-xs text-chatter-text-muted">More</span>
      </div>
    </div>
  );
}

// Helper to reconstruct timestamps for heatmap estimation
// Note: This function is kept for future per-message heatmap accuracy
