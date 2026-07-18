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
import AdUnit from './AdUnit';
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
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">💬</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-chatter-accent font-display tracking-tight">Chatter</h1>
            <p className="text-xs text-chatter-text-muted truncate">
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
          className="px-4 py-2 text-sm text-chatter-text-muted hover:text-chatter-text bg-chatter-card border border-chatter-border rounded-lg hover:border-chatter-accent/50 transition-colors shrink-0"
        >
          Upload New File
        </button>
      </motion.div>

      {/* Tab navigation — segmented control, sticky on scroll */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 mb-6 bg-chatter-bg/80 backdrop-blur-md border-b border-chatter-border/60">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto no-scrollbar"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-black'
                    : 'text-chatter-text-muted hover:text-chatter-text hover:bg-chatter-card'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg bg-chatter-accent"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
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

      {/* Ad unit — between content and footer */}
      <AdUnit slot="dashboard-bottom" className="mt-8 mb-4" />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-chatter-border">
        <div className="grid gap-6 sm:grid-cols-3 sm:items-start">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="font-display font-semibold tracking-tight text-chatter-text">Chatter</span>
          </div>
          <p className="text-xs leading-relaxed text-chatter-text-muted sm:text-center">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>🔒</span>
              All data processed locally in your browser.
            </span>
            <br className="hidden sm:block" />
            Nothing is ever uploaded.
          </p>
          <p className="text-xs text-chatter-text-muted/50 sm:text-right">
            Reads WhatsApp <code className="font-mono">_chat.txt</code> exports
          </p>
        </div>
      </footer>
    </div>
  );
}
