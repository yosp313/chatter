import type { Message, ChatAnalysis, ResponseTimeData, ResponseTimeStats } from '../types';
import { STOP_WORDS } from '../types';

/**
 * Analysis Engine — takes parsed messages and computes all statistics.
 */

// Compact AFINN-based sentiment wordlist (150+ most impactful words)
const SENTIMENT_WORDS: Record<string, number> = {
  // Strong positive
  amazing: 4, awesome: 4, beautiful: 3, brilliant: 3, excellent: 3, fantastic: 4,
  incredible: 4, love: 3, lovely: 3, perfect: 3, wonderful: 4, superb: 3,
  legendary: 3, masterpiece: 4, stunning: 3, glorious: 3, blessed: 2,
  // Medium positive
  happy: 2, great: 2, good: 1, nice: 2, fun: 2, excited: 3, exciting: 3,
  best: 3, better: 1, sweet: 2, cute: 2, cool: 1, thanks: 2,
  thank: 2, welcome: 1, glad: 2, enjoyed: 2, enjoy: 2, favorite: 2, fav: 2,
  win: 2, winning: 2, wow: 2, yay: 3, woohoo: 3, delicious: 3, yummy: 3,
  proud: 2, congratulations: 3, congrats: 3, hilarious: 3,
  epic: 2, party: 1, celebrate: 2, celebration: 2, helpful: 2,
  success: 2, successfully: 2, yes: 1, yeah: 1,
  definitely: 1, absolutely: 2, adorable: 3, precious: 2, charming: 2,
  impressive: 2, inspired: 2, inspiring: 2, magical: 3, marvelous: 4,
  // Medium negative
  bad: -2, sad: -2, sucks: -3, hate: -3, terrible: -3, awful: -3, angry: -2,
  mad: -2, tired: -1, boring: -2, stupid: -2, annoying: -2, annoyed: -2,
  ugly: -2, horrible: -3, gross: -2, damn: -2, crap: -2, shit: -3, fuck: -3,
  pissed: -3, fail: -2, failed: -2, loser: -2, worst: -3, worse: -2,
  // Strong negative
  disgusting: -3, pathetic: -3,
  murder: -3, kill: -3, killed: -3, death: -2, die: -2, dead: -2, pain: -2,
  crying: -2, cry: -1, upset: -2, frustrated: -2, frustrating: -2, rude: -2,
  selfish: -2, liar: -2, lies: -2, lying: -2, nasty: -2, evil: -3,
  // Mild negative
  sorry: -1, missed: -1, miss: -1, late: -1, busy: -1, hard: -1, difficult: -1,
  complicated: -1, problem: -1, problems: -1, issue: -1, issues: -1, broke: -1,
  broken: -2, stuck: -1, lost: -1, lose: -1, missing: -1, waste: -2, wasted: -2,
  // Intensifiers (boost nearby sentiment)
  very: 1, so: 0.5, really: 0.5, super: 1, extremely: 1, totally: 1,
  // Emoji replacements
  '😊': 2, '😍': 3, '🥰': 3, '😭': -1, '😢': -2, '😡': -3, '😤': -2,
  '😩': -2, '😔': -1, '🙏': 1, '❤️': 2, '💕': 2, '😂': 1, '🤣': 1,
  '🔥': 1, '💀': -1, '😱': 1, '🎉': 2, '🥳': 3, '🎂': 2, '💪': 2,
  '👍': 1, '👎': -1, '✨': 1,
  // Franco-Arabic / Arabizi — Egyptian (comprehensive)
  '7abib': 2, '7abibi': 2, '7abibti': 2, '7abiby': 2,
  '7elw': 2, '7elo': 2, '7elwa': 2, '7elwe': 2, '7elween': 2, 'helwen': 2, 'helw': 2,
  'mni7': 1, 'tayeb': 1, 'tiyeb': 1, 'tamaan': 1,
  'b7eb': 3, 'b7ebak': 3, 'b7ebik': 3, 'b7ebkom': 3,
  '3ajeb': 2, '3ajba': 2, '3ajb:n': 2,
  '2a2': 1, 'akid': 1, 'akded': 1,
  'mazboot': 1, 'mezbot': 1, 'mazbout': 1,
  'hamdellah': 2, 'hamdullah': 2, '7amdellah': 2, '7amdullah': 2, 'alhamdullah': 2,
  'sah': 0.5, 'sa7': 0.5, 'sa7ee7': 1, 'sahih': 1,
  'yalla': 0.5, 'yallah': 0.5, 'yala': 0.5,
  'inshallah': 1, 'inshaallah': 1, 'nshallah': 1,
  'ward': 1, '3asal': 2, 'yaamar': 2, 'ya3ti': 1,
  'sa7tein': 2, 'sa7ten': 2, 'sa7eteen': 2,
  'allah': 1, '3omri': 2, '7ayat': 1, 'nour': 1, '3ain': 1,
  'mna7': 1, 'bi2oul': 0.5,
  '7abb': 3, '7abeit': 3, '3ashek': 2, 'ghaley': 1, 'ghali': 1,
  'yaani': 0.5, '2asap': -1,
  // Egyptian positive — everyday
  'kwayes': 2, 'kways': 2, 'kwayesa': 2, '6az': 2, '6z': 2,
  'far7an': 3, 'far7ana': 3, 'far7ane': 3,
  'tamam': 1, 'tmam': 1, 'kolo tmam': 2, 'kollo': 1, 'kolloh': 1,
  '7ader': 0.5, '7adr': 0.5, 'na3am': 0.5, 'aywa': 0.5, 'aiwa': 0.5,
  '6ab': 0.5, 'tab': 0.5, 'tayb': 0.5, '6ayb': 0.5,
  '6ab3an': 1, 'tab3an': 1,
  'ahlan': 1, '7alan': 1, 'mar7aba': 1, 'marhaba': 1,
  'nafss': 0, 'nafsi': 1, 'nafsy': 1, 'nefsy': 1,
  '2ader': 0.5, 'ader': 0.5, 'kollo tamam': 2,
  '3ala 6olat': 0, '3ala tool': 0, 'bizabt': 1.5, 'bizzabt': 1.5,
  'zabat': 1, 'zabataha': 1,
  // Egyptian terms of endearment
  '2alby': 2, '2albi': 2, 'alb': 1, '2alb': 1,
  'ro7y': 2, 'rou7i': 2, '3eny': 2, '3aini': 2, '3ayny': 2,
  'ya bash': 1, 'ya basha': 1, 'ya pasha': 1, 'ya beeh': 1, 'ya beih': 1,
  'sa7by': 1.5, 'sa7bi': 1.5, 's7ab': 1, 'sahby': 1.5,
  'sa7beit': 1, 'sahaba': 1,
  'm3alem': 1, 'm3alim': 1, '3am': 0.5, '3amma': 0.5,
  'ya gam3': 0.5, 'ya gama3a': 0.5, 'gam3a': 0.5,
  'bash muhandes': 1, 'basha': 1,
  'habib alby': 3, 'habib2alby': 3, 'ya amar': 2, 'ya2amar': 2,
  // Egyptian compliments & reactions
  'ya salam': 2, 'ya sallam': 2, 'salem': 1,
  'gamed': 2, 'gameed': 2, 'gamda': 2, 'gameda': 2,
  'fa5er': 1, 'fakhr': 1, 'mabrouk': 2, 'mabrook': 2,
  'alf mabrouk': 3, 'shaka': 1, 'chaka': 1,
  '2awel': 0.5, 'montez': 2, 'mumtaz': 2,
  'sada2': 1, 'sada2ni': 1,
  // Egyptian negative — mild/medium
  'la2': -0.5, 'laa': -0.5,
  '3aks': -1, 'ghalat': -1, 'ghaltan': -1,
  'ta3ban': -1, 'ta3bana': -1, 'ta3bane': -1,
  'mo2ta': -2, 'mo2t': -2, 'molt': -2, 'ta3ba': -1,
  '3eeb': -1, '3eeb 3aleik': -2, '3eebaleik': -2,
  'wi7esh': -2, 'w7esh': -2, 'wihish': -2,
  'wa7esh': -2, 'wa7sha': -2, 'ew7ash': -2,
  '5ayeb': -2, '5aye': -2, '5ayba': -2, '5eib': -1,
  'kefaya': -0.5, 'khalas': -0.5, '5alas': -0.5, '5ales': -0.5,
  'bast': -1, 'be3eed': -0.5, 'b3eed': -0.5,
  'mesh': -1, 'mosh': -1, 'mo4': -1,
  'bat5an': -2, 'bate2': -2, 'bat2an': -2,
  'sha6r': 1, 'shater': 1, 'sha6ra': 1,
  '6am3': -1, '6am3an': -2,
  'haga': 0, 'haga helwa': 2, 'haga tanya': 0,
  'kalam': 0, 'kalam fady': -1, 'kalamfaady': -1, 'faady': -1, 'fady': -1,
  // Egyptian negative — strong insults
  '3ars': -3, '3arse': -3, '3arsa': -3,
  'harami': -3, 'harame': -3, 'haram': -1,
  '2abe7': -3, '2abih': -3, '2ab7a': -3,
  'wad mota': -3, 'ibn mota': -3, 'ibn sharmota': -3, 'ibn wiskha': -3,
  '5ara': -3, '5ara2': -3,
  'hemaar': -3, '7emaar': -3, 'kelb': -3, 'kalb': -3,
  'shermout': -3, 'sharmouta': -3, 'sharmota': -3, 'sharmoota': -3,
  'ke2eb': -2, 'kdeb': -2, 'kaddab': -2, 'kadaba': -2,
  'sa3youta': -3, 'sa3yout': -3,
  'torsh': -1, 'atrash': -1, 'ganan': -2, 'gnoun': -2,
  '2olla2ad': -3, 'ola2ad': -3,
  // Egyptian verbs & phrases (neutral)
  '3ayez': 0, '3awez': 0, '3ayzen': 0, '3ayza': 0,
  '3aref': 0, 'mesh 3aref': 0, 'mesh3aref': 0,
  '3andak': 0, '3andeko': 0, '3andi': 0,
  '2al': 0, '2olly': 0, '2olna': 0,
  'feen': 0, 'feeh': 0, 'mafesh': 0, 'mafeesh': 0,
  'keda': 0, 'kda': 0, 'kedah': 0,
  'bardo': 0, 'kaman': 0, '2ol': 0,
  '3ashan': 0, '3ashan keda': 0, '3ala fekra': 0,
  'leh': 0, 'leih': 0, '3ala': 0, 'ya3ni eh': 0,
  'halas': -0.5, '2alab': 0,
  'wa2ty': 0, 'wa2t': 0, 'sa3a': 0,
  'ba2a': 0, 'baa': 0, 'ya bah': 0,
  // Egyptian intensifiers
  'geddan': 1, 'awy': 1, '2awi': 1, 'awi': 1, 'awii': 1, '2awi gedan': 2,
  'ktir': 0.5, 'keteer': 0.5, 'akte': 0.5,
  'shwaya': 0, 'shwayet': 0, 'no2ta': 0, 'tus': 0,
  // Egyptian connectors & questions
  'eh': 0, 'eh da': 0, 'ya3ni': 0, 'ya3ne': 0,
  'ezzay': 0, 'ezay': 0, 'keif': 0, 'kefak': 0,
  'kam': 0, '2adeish': 0, '2add': 0,
  'wala': 0, 'aw': 0, 'bass': 0, 'bas': 0,
  'lak': 0, 'lol': 0, 'm3aya': 0, 'ma3aya': 0,
};

function computeMessageSentiment(text: string): number {
  // Normalize: lowercase, split into words and preserve emojis
  const tokens = text.toLowerCase().match(/[\w']+|[^\w\s]/g) || [];
  let score = 0;
  let negateNext = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for negation words (standalone or as suffix like don't, can't)
    if (['not', 'never', 'no', 'nobody'].includes(token) || token.endsWith("n't")) {
      negateNext = true;
      continue;
    }

    // Look up sentiment
    let wordScore = SENTIMENT_WORDS[token] || 0;

    // Apply negation to adjacent sentiment word
    if (negateNext && wordScore !== 0) {
      wordScore = -wordScore;
      negateNext = false;
    }

    score += wordScore;
  }

  return score;
}

export function analyzeMessages(messages: Message[]): ChatAnalysis {
  const participants = [...new Set(messages.map((m) => m.sender))].sort();

  const totalMessages = messages.length;
  let totalWords = 0;
  let totalEmojis = 0;
  let totalMedia = 0;

  const messagesPerDay: Record<string, number> = {};
  const sentimentPerDay: Record<string, { score: number; count: number }> = {};
  const messagesByHour: Record<number, number> = {};
  const messagesBySender: Record<string, number> = {};
  const wordsBySender: Record<string, number> = {};
  const emojiStats: { emoji: string; count: number; sender: string }[] = [];
  const wordCounts: Record<string, number> = {};
  const dailyActivity: Record<number, number> = {};
  const senderMessageLengths: Record<string, number[]> = {};
  const mediaBySender: Record<string, number> = {};
  const emojisBySender: Record<string, number> = {};
  const emojiCountMap: Record<string, { count: number; senders: Record<string, number> }> = {};
  const doubleTextCounts: Record<string, number> = {};
  const dayFirstSenders: Record<string, string> = {};

  let minDate = messages[0]?.timestamp || new Date();
  let maxDate = messages[0]?.timestamp || new Date();
  let lateNightCount = 0;
  let lastSender: string | null = null;
  let doubleTextRun = 0;

  for (const msg of messages) {
    // Track date range
    if (msg.timestamp < minDate) minDate = msg.timestamp;
    if (msg.timestamp > maxDate) maxDate = msg.timestamp;

    // Messages per sender
    messagesBySender[msg.sender] = (messagesBySender[msg.sender] || 0) + 1;

    // Media count
    if (msg.isMedia) {
      totalMedia++;
      mediaBySender[msg.sender] = (mediaBySender[msg.sender] || 0) + 1;
    }

    // Word count — skip media messages (system labels like "image omitted")
    if (!msg.isMedia) {
      const words = msg.text
        .replace(/[^\w\s']|_/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 0);
      totalWords += words.length;
      wordsBySender[msg.sender] = (wordsBySender[msg.sender] || 0) + words.length;

      // Message length tracking — only for real text messages
      if (!senderMessageLengths[msg.sender]) senderMessageLengths[msg.sender] = [];
      senderMessageLengths[msg.sender].push(msg.text.length);

      // Word frequency
      for (const word of words) {
        const lower = word.toLowerCase().replace(/^['']+|['']+$/g, '');
        if (lower.length > 1 && !STOP_WORDS.has(lower) && /^[a-zA-Z]/.test(lower)) {
          wordCounts[lower] = (wordCounts[lower] || 0) + 1;
        }
      }
    }

    // Messages per day
    const dayKey = formatDateKey(msg.timestamp);
    messagesPerDay[dayKey] = (messagesPerDay[dayKey] || 0) + 1;

    // Sentiment per day
    const msgSentiment = computeMessageSentiment(msg.text);
    if (!sentimentPerDay[dayKey]) sentimentPerDay[dayKey] = { score: 0, count: 0 };
    sentimentPerDay[dayKey].score += msgSentiment;
    sentimentPerDay[dayKey].count += 1;

    // Messages by hour
    const hour = msg.timestamp.getHours();
    messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;

    // Daily activity (day of week)
    const dayOfWeek = msg.timestamp.getDay();
    dailyActivity[dayOfWeek] = (dailyActivity[dayOfWeek] || 0) + 1;

    // Emoji tracking
    totalEmojis += msg.emojis.length;
    emojisBySender[msg.sender] = (emojisBySender[msg.sender] || 0) + msg.emojis.length;

    for (const emoji of msg.emojis) {
      if (!emojiCountMap[emoji]) {
        emojiCountMap[emoji] = { count: 0, senders: {} };
      }
      emojiCountMap[emoji].count++;
      emojiCountMap[emoji].senders[msg.sender] =
        (emojiCountMap[emoji].senders[msg.sender] || 0) + 1;
    }

    // Late night tracking (midnight - 5am)
    if (hour >= 0 && hour < 6) lateNightCount++;

    // Double text tracking
    if (msg.sender === lastSender) {
      doubleTextRun++;
      if (doubleTextRun === 2) {
        doubleTextCounts[msg.sender] = (doubleTextCounts[msg.sender] || 0) + 1;
      } else if (doubleTextRun > 2) {
        doubleTextCounts[msg.sender] = (doubleTextCounts[msg.sender] || 0) + 1;
      }
    } else {
      doubleTextRun = 0;
    }
    lastSender = msg.sender;

    // First message of each day (conversation starter)
    if (!dayFirstSenders[dayKey]) {
      dayFirstSenders[dayKey] = msg.sender;
    }
  }

  // Build emoji stats sorted by count
  for (const [emoji, data] of Object.entries(emojiCountMap)) {
    const topSender = Object.entries(data.senders).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    emojiStats.push({ emoji, count: data.count, sender: topSender });
  }
  emojiStats.sort((a, b) => b.count - a.count);

  // Top words
  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([word, count]) => ({ word, count }));

  // Streaks
  const streaks = calculateStreaks(messagesPerDay);

  // Late night index
  const lateNightFraction = totalMessages > 0 ? lateNightCount / totalMessages : 0;

  // Double texters (consecutive messages)
  const doubleTexters: Record<string, number> = {};
  for (const [sender, count] of Object.entries(doubleTextCounts)) {
    if (count > 0) doubleTexters[sender] = count;
  }

  // Conversation starters (who sends the first message each day)
  const conversationStarters: Record<string, number> = {};
  for (const sender of Object.values(dayFirstSenders)) {
    conversationStarters[sender] = (conversationStarters[sender] || 0) + 1;
  }

  // Pick Me Index — ratio of initiating vs total messages
  const pickMeIndex: Record<string, number> = {};
  for (const [sender, total] of Object.entries(messagesBySender)) {
    const started = conversationStarters[sender] || 0;
    if (total > 0) {
      pickMeIndex[sender] = started / total;
    }
  }

  // Unique emoji signature — which emoji each person uses most relative to others
  const uniqueEmojiScore: Record<string, string> = {};
  for (const [emoji, data] of Object.entries(emojiCountMap)) {
    const totalUses = data.count;
    for (const [sender, senderCount] of Object.entries(data.senders)) {
      const share = senderCount / totalUses;
      if (share > 0.5) {
        // This person uses this emoji more than everyone else combined
        const existing = uniqueEmojiScore[sender];
        if (!existing || totalUses > (emojiCountMap[existing]?.count || 0)) {
          uniqueEmojiScore[sender] = emoji;
        }
      }
    }
  }

  // Average message length per sender
  const avgMessageLength: Record<string, number> = {};
  for (const [sender, lengths] of Object.entries(senderMessageLengths)) {
    avgMessageLength[sender] = Math.round(
      lengths.reduce((a, b) => a + b, 0) / lengths.length
    );
  }

  // Response times
  const responseTimes = computeResponseTimes(messages);

  // Average sentiment per day (normalized)
  const normalizedSentimentPerDay: Record<string, number> = {};
  let totalSentiment = 0;
  let sentimentDays = 0;
  for (const [day, data] of Object.entries(sentimentPerDay)) {
    const avg = data.count > 0 ? Math.round((data.score / data.count) * 100) / 100 : 0;
    normalizedSentimentPerDay[day] = avg;
    totalSentiment += avg;
    sentimentDays++;
  }

  const averageSentiment = sentimentDays > 0
    ? Math.round((totalSentiment / sentimentDays) * 100) / 100
    : 0;

  // Determine sentiment trend (compare first half vs second half)
  const sortedDays = Object.keys(normalizedSentimentPerDay).sort();
  const mid = Math.floor(sortedDays.length / 2);
  const firstHalf = sortedDays.slice(0, mid);
  const secondHalf = sortedDays.slice(mid);
  const firstAvg = firstHalf.length > 0
    ? firstHalf.reduce((s, d) => s + (normalizedSentimentPerDay[d] || 0), 0) / firstHalf.length
    : 0;
  const secondAvg = secondHalf.length > 0
    ? secondHalf.reduce((s, d) => s + (normalizedSentimentPerDay[d] || 0), 0) / secondHalf.length
    : 0;

  const diff = secondAvg - firstAvg;
  const sentimentTrend: 'up' | 'down' | 'stable' =
    diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'stable';

  return {
    participants,
    totalMessages,
    totalWords,
    totalEmojis,
    totalMedia,
    dateRange: { start: minDate, end: maxDate },
    messagesPerDay,
    sentimentPerDay: normalizedSentimentPerDay,
    sentimentTrend,
    averageSentiment,
    messagesByHour,
    messagesBySender,
    wordsBySender,
    emojiStats: emojiStats.slice(0, 50),
    topWords,
    streaks,
    dailyActivity,
    avgMessageLength,
    responseTimes,
    lateNightFraction,
    doubleTexters,
    conversationStarters,
    pickMeIndex,
    uniqueEmojiScore,
    mediaBySender,
    emojisBySender,
  };
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateStreaks(messagesPerDay: Record<string, number>): {
  longest: number;
  current?: number;
} {
  const days = Object.keys(messagesPerDay).sort();
  if (days.length === 0) return { longest: 0 };

  let longest = 1;
  let currentStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > longest) longest = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  // Calculate current streak (from today backward)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(checkDate);
    if (messagesPerDay[key]) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    longest,
    current: current > 0 ? current : undefined,
  };
}

/** Compute response times between consecutive messages from different senders */
function computeResponseTimes(messages: Message[]): ResponseTimeData {
  if (messages.length < 2) {
    return {
      overall: { avgSeconds: 0, minSeconds: 0, maxSeconds: 0, medianSeconds: 0, ghosted: 0 },
      perPerson: {},
      fastest: { name: '—', avgSeconds: 0 },
      slowest: { name: '—', avgSeconds: 0 },
      bestPair: { from: '—', to: '—', avgSeconds: 0 },
      worstPair: { from: '—', to: '—', avgSeconds: 0 },
      hourlyBreakdown: {},
    };
  }

  // Collect response times: time between consecutive messages when sender changes
  const personTimes: Record<string, number[]> = {};
  const pairTimes: Record<string, number[]> = {};
  const allTimes: number[] = [];
  let ghosted = 0;

  // Sort by timestamp just in case
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Only count when sender changes (someone replying to someone else)
    if (curr.sender === prev.sender) continue;

    const diffMs = curr.timestamp.getTime() - prev.timestamp.getTime();
    const diffSec = Math.round(diffMs / 1000);

    // Skip gaps > 7 days (vacation, inactive periods)
    if (diffSec > 7 * 24 * 3600) continue;

    // Track ghosted: messages left on read > 24h
    if (diffSec > 24 * 3600) ghosted++;

    allTimes.push(diffSec);

    // Per person (who received and replied)
    if (!personTimes[curr.sender]) personTimes[curr.sender] = [];
    personTimes[curr.sender].push(diffSec);

    // Per pair
    const pairKey = `${prev.sender} → ${curr.sender}`;
    if (!pairTimes[pairKey]) pairTimes[pairKey] = [];
    pairTimes[pairKey].push(diffSec);
  }

  if (allTimes.length === 0) {
    return {
      overall: { avgSeconds: 0, minSeconds: 0, maxSeconds: 0, medianSeconds: 0, ghosted: 0 },
      perPerson: {},
      fastest: { name: '—', avgSeconds: 0 },
      slowest: { name: '—', avgSeconds: 0 },
      bestPair: { from: '—', to: '—', avgSeconds: 0 },
      worstPair: { from: '—', to: '—', avgSeconds: 0 },
      hourlyBreakdown: {},
    };
  }

  const calcStats = (times: number[]): ResponseTimeStats => {
    const s = [...times].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return {
      avgSeconds: Math.round(s.reduce((a, b) => a + b, 0) / s.length),
      minSeconds: s[0],
      maxSeconds: s[s.length - 1],
      medianSeconds: s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid],
      ghosted,
    };
  };

  const overall = calcStats(allTimes);

  // Per person
  const perPerson: Record<string, ResponseTimeStats> = {};
  for (const [name, times] of Object.entries(personTimes)) {
    perPerson[name] = calcStats(times);
  }

  // Find fastest/slowest responder (min 3 replies to count)
  const responderEntries = Object.entries(perPerson).filter(([, s]) => s.avgSeconds > 0);
  const fastest = responderEntries.length
    ? { name: responderEntries.sort((a, b) => a[1].avgSeconds - b[1].avgSeconds)[0][0],
        avgSeconds: responderEntries.sort((a, b) => a[1].avgSeconds - b[1].avgSeconds)[0][1].avgSeconds }
    : { name: '—', avgSeconds: 0 };
  const slowest = responderEntries.length
    ? { name: responderEntries.sort((a, b) => b[1].avgSeconds - a[1].avgSeconds)[0][0],
        avgSeconds: responderEntries.sort((a, b) => b[1].avgSeconds - a[1].avgSeconds)[0][1].avgSeconds }
    : { name: '—', avgSeconds: 0 };

  // Find best/worst pair
  const pairEntries = Object.entries(pairTimes).map(([key, times]) => {
    const s = calcStats(times);
    const [from, to] = key.split(' → ');
    return { from, to, avgSeconds: s.avgSeconds };
  }).filter(p => p.avgSeconds > 0);

  const bestPair = pairEntries.length
    ? pairEntries.sort((a, b) => a.avgSeconds - b.avgSeconds)[0]
    : { from: '—', to: '—', avgSeconds: 0 };
  const worstPair = pairEntries.length
    ? pairEntries.sort((a, b) => b.avgSeconds - a.avgSeconds)[0]
    : { from: '—', to: '—', avgSeconds: 0 };

  return {
    overall,
    perPerson,
    fastest,
    slowest,
    bestPair,
    worstPair,
    hourlyBreakdown: {},
  };
}
