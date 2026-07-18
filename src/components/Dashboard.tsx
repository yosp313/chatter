import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Overview from './Overview';
import ActivityHeatmap from './ActivityHeatmap';
import PeopleBreakdown from './PeopleBreakdown';
import EmojiWall from './EmojiWall';
import WordCloud from './WordCloud';
import Timeline from './Timeline';
import ChatWrapped from './ChatWrapped';
import SentimentTimeline from './SentimentTimeline';
import ResponseTime from './ResponseTime';
import Vibes from './Vibes';
import type { ChatAnalysis, ParsedData } from '../types';

interface Props {
  analysis: ChatAnalysis;
  parsedData: ParsedData;
  onReset: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'heatmap', label: 'Activity', icon: '🗺️' },
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'emojis', label: 'Emojis', icon: '😊' },
  { id: 'words', label: 'Words', icon: '📝' },
  { id: 'timeline', label: 'Timeline', icon: '📈' },
  { id: 'response', label: 'Response', icon: '⚡' },
  { id: 'sentiment', label: 'Sentiment', icon: '❤️' },
  { id: 'vibes', label: 'Vibes', icon: '🔥' },
  { id: 'wrapped', label: 'Wrapped', icon: '🎁' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Dashboard({ analysis, parsedData, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('wrapped');

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <div>
            <h1 className="text-2xl font-bold text-chatter-accent">Chatter</h1>
            <p className="text-xs text-chatter-text-muted">
              {parsedData.fileName} · {parsedData.messages.length.toLocaleString()} messages
              {parsedData.parseErrors > 0 && (
                <span className="text-chatter-error ml-2">
                  ({parsedData.parseErrors} parsing errors)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-chatter-text-muted hover:text-chatter-text bg-chatter-card border border-chatter-border rounded-lg hover:border-chatter-accent/50 transition-colors"
        >
          Upload New File
        </button>
      </motion.div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-chatter-accent text-black shadow-lg shadow-chatter-accent/20'
                : 'text-chatter-text-muted hover:text-chatter-text hover:bg-chatter-card'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <Overview analysis={analysis} />}
          {activeTab === 'heatmap' && <ActivityHeatmap analysis={analysis} />}
          {activeTab === 'people' && <PeopleBreakdown analysis={analysis} />}
          {activeTab === 'emojis' && <EmojiWall analysis={analysis} />}
          {activeTab === 'words' && <WordCloud analysis={analysis} />}
          {activeTab === 'timeline' && <Timeline analysis={analysis} />}
          {activeTab === 'response' && <ResponseTime analysis={analysis} />}
          {activeTab === 'sentiment' && <SentimentTimeline analysis={analysis} />}
          {activeTab === 'vibes' && <Vibes analysis={analysis} />}
          {activeTab === 'wrapped' && <ChatWrapped analysis={analysis} parsedData={parsedData} />}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-chatter-border text-center">
        <p className="text-xs text-chatter-text-muted/40">
          All data processed locally in your browser · No data ever uploaded
        </p>
      </div>
    </div>
  );
}
