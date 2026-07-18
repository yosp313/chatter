import { useState, useMemo } from 'react';
import type { ChatAnalysis } from '../types';
import { PARTICIPANT_COLORS } from '../types';

interface Props {
  analysis: ChatAnalysis;
}

interface WordCloudWord {
  text: string;
  value: number;
  color?: string;
}

export default function WordCloud({ analysis }: Props) {
  const [selectedPerson, setSelectedPerson] = useState<string | 'all'>('all');

  const words: WordCloudWord[] = useMemo(() => {
    if (selectedPerson === 'all') {
      return analysis.topWords.slice(0, 80).map((w, i) => ({
        text: w.word,
        value: w.count,
        color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
      }));
    }
    return [];
  }, [analysis, selectedPerson]);

  // Size calculation for cloud display
  const maxValue = useMemo(
    () => (words.length > 0 ? words[0].value : 1),
    [words]
  );

  // Simple grid-based word cloud since react-wordcloud has peer dep issues
  // We'll create a visual representation using a sorted layout
  const sortedWords = useMemo(
    () => [...words].sort((a, b) => b.value - a.value),
    [words]
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-chatter-text mb-6">Word Cloud</h2>

      {/* Person selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedPerson('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedPerson === 'all'
              ? 'bg-chatter-accent text-black'
              : 'bg-chatter-card text-chatter-text-muted border border-chatter-border hover:border-chatter-accent/50'
          }`}
        >
          Everyone
        </button>
        {analysis.participants.map((name) => (
          <button
            key={name}
            onClick={() => setSelectedPerson(name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedPerson === name
                ? 'bg-chatter-accent text-black'
                : 'bg-chatter-card text-chatter-text-muted border border-chatter-border hover:border-chatter-accent/50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Word display */}
      <div className="bg-chatter-card rounded-xl p-6 border border-chatter-border min-h-[300px]">
        {sortedWords.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-chatter-text-muted">
            <p>No words to display. Per-person word cloud coming soon.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center justify-center min-h-[300px] p-4">
            {sortedWords.map((word, i) => {
              // Size scaled by frequency
              const size =
                0.7 + (word.value / maxValue) * 2.0;
              const opacity = 0.5 + (word.value / maxValue) * 0.5;
              return (
                <span
                  key={word.text + i}
                  className="inline-block leading-tight hover:scale-110 transition-transform cursor-default"
                  style={{
                    fontSize: `${size}rem`,
                    color: word.color || '#f59e0b',
                    opacity,
                    fontWeight: word.value > maxValue * 0.3 ? 700 : 400,
                  }}
                  title={`${word.text}: ${word.value} occurrences`}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Top words list */}
      <div className="mt-4 bg-chatter-card rounded-xl p-5 border border-chatter-border">
        <h3 className="text-sm font-medium text-chatter-text-muted mb-3">
          Top 10 Words
        </h3>
        <div className="space-y-2">
          {analysis.topWords.slice(0, 10).map((word, i) => (
            <div key={word.word} className="flex items-center gap-3">
              <span className="text-xs text-chatter-text-muted w-5 text-right font-mono">
                #{i + 1}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium text-chatter-text capitalize">
                  {word.word}
                </span>
                <div className="flex-1 h-2 bg-chatter-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chatter-accent/60 rounded-full transition-all"
                    style={{
                      width: `${(word.count / (analysis.topWords[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-chatter-text-muted font-mono">
                {word.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
