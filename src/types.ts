export interface Message {
  sender: string;
  text: string;
  timestamp: Date;
  isMedia: boolean;
  emojis: string[];
}

export interface ChatAnalysis {
  participants: string[];
  totalMessages: number;
  totalWords: number;
  totalEmojis: number;
  totalMedia: number;
  dateRange: { start: Date; end: Date };
  messagesPerDay: Record<string, number>;
  sentimentPerDay: Record<string, number>;
  sentimentTrend: 'up' | 'down' | 'stable';
  averageSentiment: number;
  messagesByHour: Record<number, number>;
  messagesBySender: Record<string, number>;
  wordsBySender: Record<string, number>;
  emojiStats: { emoji: string; count: number; sender: string }[];
  topWords: { word: string; count: number }[];
  streaks: { longest: number; current?: number };
  dailyActivity: Record<number, number>;
  avgMessageLength: Record<string, number>;
  mediaBySender: Record<string, number>;
  emojisBySender: Record<string, number>;
  responseTimes: ResponseTimeData;
  lateNightFraction: number;
  doubleTexters: Record<string, number>;
  conversationStarters: Record<string, number>;
  pickMeIndex: Record<string, number>;
  uniqueEmojiScore: Record<string, string>;
}

export interface ResponseTimeStats {
  avgSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  medianSeconds: number;
  ghosted: number; // messages with no reply > 24h
}

export interface ResponseTimeData {
  overall: ResponseTimeStats;
  perPerson: Record<string, ResponseTimeStats>;
  fastest: { name: string; avgSeconds: number };
  slowest: { name: string; avgSeconds: number };
  bestPair: { from: string; to: string; avgSeconds: number };
  worstPair: { from: string; to: string; avgSeconds: number };
  hourlyBreakdown: Record<string, { asks: number; avgReply: number }>;
}

export interface ParsedData {
  messages: Message[];
  fileName: string;
  parseErrors: number;
}

export interface ParticipantColor {
  name: string;
  color: string;
}

export const PARTICIPANT_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#84cc16', // lime
  '#d946ef', // fuchsia
];

export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'by', 'with', 'from', 'as', 'is', 'was', 'were', 'be', 'been',
  'are', 'it', 'its', 'that', 'this', 'these', 'those', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they',
  'them', 'their', 'not', 'no', 'so', 'if', 'do', 'did', 'does', 'has',
  'have', 'had', 'can', 'will', 'would', 'could', 'should', 'may', 'than',
  'then', 'just', 'also', 'very', 'like', 'get', 'got', 'go', 'went',
  'am', 'all', 'about', 'up', 'out', 'because', 'what', 'when', 'where',
  'who', 'which', 'how', 'some', 'any', 'each', 'every', 'both', 'more',
  'most', 'other', 'into', 'over', 'after', 'before', 'between', 'under',
  'here', 'there', 'im', 'dont', 'didnt', 'wasnt', 'couldnt', 'wouldnt',
  'shouldnt', 'havent', 'hasnt', 'hadnt', 'cant', 'wont', 'isnt', 'arent',
  'ive', 'youve', 'weve', 'theyve', 'id', 'youll', 's', 't', 're', 've',
  'll', 'm', 'de', 'la', 'el', 'en', 'un', 'que', 'no', 'se', 'lo',
  // WhatsApp system/media junk words
  'omitted', 'image', 'video', 'audio', 'sticker', 'document', 'gif',
  'voice', 'media', 'pm', 'am', 'message', 'call', 'missed',
  // More English media/system words
  'photo', 'photos', 'location', 'contact', 'contacts', 'attached',
  'kb', 'mb', 'gb', 'deleted', 'removed',
  // Franco-Arabic media labels
  'soura', 'sora', 'sura', 'surat', // صورة (image)
  'molsa2', 'mulsaq', 'malsa2', 'molsa2a', // ملصق (sticker)
  'sawti', 'sawteya', 'sawtiya', 'sawty', // صوتية (voice)
  '7azef', 'mostanad', 'mostaned', // مستند (document)
  'mokalma', // مكالمة (call)
  'tam', 'el7azf', 'elhazf', // تم الحذف (omitted/deleted)
  // Franco-Arabic common chat filler that's not meaningful
  'ya3ni', 'keda', 'bardo',
]);
