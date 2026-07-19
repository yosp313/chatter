import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import type { ChatAnalysis, ParsedData } from '../types';

interface Props {
  analysis: ChatAnalysis;
  parsedData: ParsedData;
}

interface SlideData {
  id: string;
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  bg: string;
  accent: string;
  anim: 'center' | 'stat' | 'emoji' | 'final';
}

const PARTICIPANT_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f97316', '#6366f1', '#06b6d4', '#eab308',
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─────────── Particle config ───────────
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  size: 4 + Math.random() * 12,
  delay: Math.random() * 6,
  duration: 4 + Math.random() * 6,
  drift: -30 + Math.random() * 60,
}));

// ─────────── Stagger variants ───────────
const staggerItem = (delay: number) => ({
  hidden: { opacity: 0, y: 30, scale: 0.8 } as const,
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 14, delay },
  },
});

// ─────────── Slide transition variants ───────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.8 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? -15 : 15,
    transition: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.8 },
  }),
};

export default function ChatWrapped({ analysis, parsedData }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const wrappedRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  const days = Math.round(
    (analysis.dateRange.end.getTime() - analysis.dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

  // Busiest day
  const busiestDayEntry = useMemo(() => {
    const entries = Object.entries(analysis.messagesPerDay);
    if (entries.length === 0) return null;
    const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const d = new Date(max[0] + 'T00:00:00');
    return {
      date: max[0], count: max[1],
      dayName: DAYS[d.getDay()],
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  }, [analysis.messagesPerDay]);

  // Top emoji
  const topEmoji = analysis.emojiStats[0]?.emoji || '💬';
  const topEmojiCount = analysis.emojiStats[0]?.count || 0;

  // Top talker
  const topTalker = useMemo(() => {
    const entries = Object.entries(analysis.messagesBySender);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [analysis.messagesBySender]);

  const topWord = analysis.topWords[0]?.word || '—';

  const talkerIndex = topTalker
    ? analysis.participants.indexOf(topTalker[0])
    : 0;
  const talkerColor = PARTICIPANT_COLORS[talkerIndex % PARTICIPANT_COLORS.length];

  // ─── Vibes stats ───
  const lateNightPct = Math.round(analysis.lateNightFraction * 100);

  const sortedDoubleText = useMemo(() =>
    Object.entries(analysis.doubleTexters).sort((a, b) => b[1] - a[1]),
    [analysis.doubleTexters]
  );
  const topDoubleTexter = sortedDoubleText[0];

  const sortedInitiative = useMemo(() =>
    Object.entries(analysis.pickMeIndex)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]),
    [analysis.pickMeIndex]
  );
  const topStarter = sortedInitiative[0];
  const topStarterPct = topStarter ? Math.round(topStarter[1] * 100) : 0;

  const sortedByResponse = useMemo(() =>
    Object.entries(analysis.responseTimes.perPerson)
      .filter(([, s]) => s.avgSeconds > 0)
      .sort((a, b) => a[1].avgSeconds - b[1].avgSeconds),
    [analysis.responseTimes]
  );
  const fastestResponder = sortedByResponse[0];
  const fastestTime = fastestResponder ? fastestResponder[1].avgSeconds : 0;

  const topGhosted = useMemo(() =>
    Object.entries(analysis.responseTimes.perPerson)
      .filter(([, s]) => s.ghosted > 0)
      .sort((a, b) => b[1].ghosted - a[1].ghosted),
    [analysis.responseTimes]
  );
  const ghostKing = topGhosted[0];

  // Unique emoji signatures
  const emojiSigs = Object.entries(analysis.uniqueEmojiScore).slice(0, 3);

  // ─── slides ───
  const slides: SlideData[] = [
    {
      id: 'welcome', icon: '💬', title: 'Your Chat Wrapped',
      value: parsedData.fileName.replace('_chat.txt', '').replace('.txt', '') || 'This Conversation',
      subtitle: `${analysis.totalMessages.toLocaleString()} messages over ${days} days`,
      bg: 'from-amber-900/40 via-chatter-bg to-chatter-bg', accent: '#f59e0b', anim: 'center',
    },
    {
      id: 'messages', icon: '✉️', title: 'Total Messages',
      value: analysis.totalMessages.toLocaleString(),
      subtitle: `${analysis.totalWords.toLocaleString()} words · ${analysis.totalEmojis.toLocaleString()} emojis · ${analysis.totalMedia} media`,
      bg: 'from-emerald-900/30 via-chatter-bg to-chatter-bg', accent: '#10b981', anim: 'stat',
    },
    {
      id: 'busiest', icon: '📅', title: 'Busiest Day',
      value: busiestDayEntry ? `${busiestDayEntry.count.toLocaleString()} messages` : '—',
      subtitle: busiestDayEntry ? `${busiestDayEntry.dayName}, ${busiestDayEntry.formatted}` : '',
      bg: 'from-violet-900/30 via-chatter-bg to-chatter-bg', accent: '#8b5cf6', anim: 'stat',
    },
    {
      id: 'toptalker', icon: '👑', title: 'Top Chatter',
      value: topTalker ? topTalker[0] : '—',
      subtitle: topTalker ? `${topTalker[1].toLocaleString()} messages sent` : '',
      bg: 'from-pink-900/30 via-chatter-bg to-chatter-bg', accent: talkerColor, anim: 'center',
    },
    {
      id: 'emoji', icon: topEmoji, title: 'Favorite Emoji',
      value: topEmoji,
      subtitle: `Used ${topEmojiCount.toLocaleString()} times`,
      bg: 'from-orange-900/30 via-chatter-bg to-chatter-bg', accent: '#f97316', anim: 'emoji',
    },
    {
      id: 'word', icon: '📝', title: 'Most Used Word',
      value: `"${topWord}"`,
      subtitle: analysis.topWords[0] ? `${analysis.topWords[0].count.toLocaleString()} occurrences` : '',
      bg: 'from-blue-900/30 via-chatter-bg to-chatter-bg', accent: '#3b82f6', anim: 'center',
    },
    {
      id: 'streak', icon: '🔥', title: 'Longest Streak',
      value: `${analysis.streaks.longest} days`,
      subtitle: analysis.streaks.current
        ? `You're on a ${analysis.streaks.current}-day streak right now!`
        : 'Consecutive days with messages',
      bg: 'from-rose-900/30 via-chatter-bg to-chatter-bg', accent: '#e11d48', anim: 'stat',
    },
    // ─── Vibes slides ───
    {
      id: 'latenight', icon: '🌙', title: 'Late Night Index',
      value: `${lateNightPct}%`,
      subtitle: lateNightPct > 30
        ? 'Sleep is optional for this chat'
        : lateNightPct > 15
          ? 'Night owls in the house 🦉'
          : 'Early birds — 9-to-5 chat hours',
      bg: 'from-indigo-900/30 via-chatter-bg to-chatter-bg', accent: '#6366f1', anim: 'stat',
    },
    {
      id: 'doubletext', icon: '👀', title: 'Double Text King',
      value: topDoubleTexter ? topDoubleTexter[0] : '—',
      subtitle: topDoubleTexter
        ? `${topDoubleTexter[1].toLocaleString()} double texts · we saw you`
        : 'Nobody double texts here — impressive restraint',
      bg: 'from-orange-900/30 via-chatter-bg to-chatter-bg', accent: '#f97316', anim: 'center',
    },
    {
      id: 'initiative', icon: '💀', title: '"So Anyway..." Award',
      value: topStarter ? topStarter[0] : '—',
      subtitle: topStarter
        ? `Starts ${topStarterPct}% of conversations · carries the chat`
        : 'Not enough data to crown a starter',
      bg: 'from-fuchsia-900/30 via-chatter-bg to-chatter-bg', accent: '#d946ef', anim: 'center',
    },
    {
      id: 'fastest', icon: '⚡', title: 'Fastest Responder',
      value: fastestResponder ? fastestResponder[0] : '—',
      subtitle: fastestResponder
        ? `Avg reply in ${fastestTime < 60 ? fastestTime + 's' : Math.round(fastestTime / 60) + 'm'} · phone glued to hand`
        : 'Not enough reply data',
      bg: 'from-cyan-900/30 via-chatter-bg to-chatter-bg', accent: '#06b6d4', anim: 'center',
    },
    {
      id: 'ghost', icon: '👻', title: 'Ghost Award',
      value: ghostKing ? ghostKing[0] : '—',
      subtitle: ghostKing
        ? `Left ${ghostKing[1].ghosted} messages on read · certified ghoster`
        : 'No ghosting here! Everyone replies 🤝',
      bg: 'from-slate-900/30 via-chatter-bg to-chatter-bg', accent: '#64748b', anim: 'center',
    },
    {
      id: 'emojisig', icon: '🎭', title: 'Emoji Personalities',
      value: emojiSigs.length > 0 ? `${emojiSigs[0][0]} ${emojiSigs[0][1]}` : '—',
      subtitle: emojiSigs.slice(0, 3).map(([name, emoji]) => `${name} → ${emoji}`).join(' · '),
      bg: 'from-pink-900/30 via-chatter-bg to-chatter-bg', accent: '#ec4899', anim: 'emoji',
    },
    {
      id: 'vibe', icon: analysis.sentimentTrend === 'up' ? '📈' : analysis.sentimentTrend === 'down' ? '📉' : '➡️',
      title: 'Chat Vibe',
      value: analysis.sentimentTrend === 'up'
        ? 'Getting Better ☀️'
        : analysis.sentimentTrend === 'down' ? 'Getting Heavier 🌧️' : 'Steady as Ever ✨',
      subtitle: `Average sentiment: ${analysis.averageSentiment > 0 ? '+' : ''}${analysis.averageSentiment.toFixed(2)}`,
      bg: 'from-amber-900/30 via-chatter-bg to-chatter-bg', accent: '#f59e0b', anim: 'final',
    },
  ];

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  // ─── Auto-advance (5s per slide) ───
  useEffect(() => {
    if (!isAutoPlaying || isHovering) return;
    autoPlayTimerRef.current = setInterval(() => {
      goNext();
    }, 5000);
    return () => { if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current); }
  }, [isAutoPlaying, isHovering, currentSlide]);

  // ─── Progress bar animation ───
  useEffect(() => {
    if (!progressRef.current || isHovering) return;
    const bar = progressRef.current;
    bar.style.transition = 'none';
    bar.style.width = '0%';
    // Force reflow
    bar.getBoundingClientRect();
    bar.style.transition = `width 5s linear`;
    bar.style.width = '100%';
  }, [currentSlide, isHovering]);

  // ─── Count-up animation for stat slides ───
  useEffect(() => {
    if (slide.anim !== 'stat') { setCountUp(0); return; }
    const target = parseInt(slide.value.replace(/,/g, ''));
    if (isNaN(target)) return;
    countRef.current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const interval = setInterval(() => {
      countRef.current += step;
      if (countRef.current >= target) {
        countRef.current = target;
        clearInterval(interval);
      }
      setCountUp(countRef.current);
    }, 25);
    return () => clearInterval(interval);
  }, [currentSlide, slide.anim, slide.value]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > currentSlide ? 1 : -1);
    setCurrentSlide(i);
  }, [currentSlide]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!wrappedRef.current) return;
    setDownloading(true);
    try {
      const blob = await toBlob(wrappedRef.current, {
        backgroundColor: '#0f0f1a',
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      if (!blob) throw new Error('Failed to generate image');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `chat-wrapped-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-chatter-text">Chat Wrapped</h2>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-chatter-accent rounded-lg hover:bg-chatter-accent/90 transition-colors ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>{downloading ? '⏳' : '⬇️'}</span>
          {downloading ? 'Generating...' : 'Download PNG'}
        </button>
      </div>

      {/* ────── Card ────── */}
      <motion.div
        ref={wrappedRef}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
        className="wrapped-card relative overflow-hidden rounded-2xl border border-chatter-border mx-auto"
        style={{ width: 520, height: 700, maxWidth: '100%' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* ── Background layer ── */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${slide.bg} transition-all duration-700`}
        />

        {/* ── Pulsing accent glow ── */}
        <motion.div
          key={slide.id + '-glow'}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.12, 0.2, 0.12], scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: slide.accent }}
        />
        <motion.div
          key={slide.id + '-glow2'}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.08, 0.14, 0.08], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl"
          style={{ backgroundColor: slide.accent }}
        />

        {/* ── Floating particles ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: '-5%',
                width: p.size,
                height: p.size,
                backgroundColor: slide.accent,
                opacity: 0.15,
              }}
              animate={{
                y: [-700, -800],
                x: [0, p.drift],
                opacity: [0.15, 0.25, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        {/* ── Spotify-style top progress bar ── */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-chatter-text-muted/15 z-20">
          <motion.div
            ref={progressRef}
            className="h-full rounded-full"
            style={{ backgroundColor: slide.accent, width: '0%' }}
          />
        </div>

        {/* ── Slide number ── */}
        <div className="absolute top-5 left-6 z-20 text-xs font-mono text-chatter-text-muted/40">
          {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>

        {/* ── Content ── */}
        <div
          className="relative z-10 flex flex-col items-center justify-center h-full px-10 text-center"
          style={{ perspective: 1000 }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Icon with bounce */}
              {slide.anim === 'emoji' ? (
                <motion.span
                  className="text-8xl block"
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {slide.icon}
                </motion.span>
              ) : (
                <motion.span
                  variants={staggerItem(0)}
                  initial="hidden"
                  animate="visible"
                  className="text-7xl block"
                >
                  {slide.icon}
                </motion.span>
              )}

              {/* Title */}
              <motion.p
                variants={staggerItem(0.15)}
                initial="hidden"
                animate="visible"
                className="text-sm font-medium uppercase tracking-[0.15em] text-chatter-text-muted"
              >
                {slide.title}
              </motion.p>

              {/* Value — with count-up for stat slides */}
              <motion.div
                variants={staggerItem(0.3)}
                initial="hidden"
                animate="visible"
                className="text-4xl sm:text-5xl font-bold leading-tight min-h-[3.5rem]"
                style={{ color: slide.accent }}
              >
                {slide.anim === 'stat' && currentSlide >= 1
                  ? countUp.toLocaleString()
                  : slide.value}
              </motion.div>

              {/* Subtitle */}
              <motion.p
                variants={staggerItem(0.45)}
                initial="hidden"
                animate="visible"
                className="text-base text-chatter-text-muted max-w-xs"
              >
                {slide.subtitle}
              </motion.p>

              {/* Final slide — confetti burst hint */}
              {isLast && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 12 }}
                  className="text-2xl mt-2"
                >
                  ✨ 🎉 ✨
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Progress dots (bottom) ── */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-2 rounded-full transition-all duration-500"
              style={{
                width: i === currentSlide ? 24 : 6,
                backgroundColor: i === currentSlide
                  ? slide.accent
                  : 'rgba(148,163,184,0.2)',
              }}
            >
              {i === currentSlide && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: slide.accent }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Watermark ── */}
        <div className="absolute top-5 right-6 z-20 text-xs text-chatter-text-muted/20 font-semibold tracking-widest">
          CHATTER
        </div>
      </motion.div>

      {/* ────── Navigation ────── */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-chatter-card border border-chatter-border text-chatter-text hover:border-chatter-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Previous
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            isAutoPlaying
              ? 'bg-chatter-accent/20 border-chatter-accent/40 text-chatter-accent'
              : 'bg-chatter-card border-chatter-border text-chatter-text-muted'
          }`}
          title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
        >
          {isAutoPlaying ? '⏸' : '▶️'}
        </motion.button>

        <button
          onClick={goNext}
          disabled={isLast}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-chatter-card border border-chatter-border text-chatter-text hover:border-chatter-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>

      <p className="text-center text-xs text-chatter-text-muted/30 mt-3">
        {isAutoPlaying ? 'Auto-advancing every 5s' : 'Auto-play paused'} · Hover to pause
      </p>
    </div>
  );
}
