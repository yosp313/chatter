import type { Message } from '../types';

/**
 * WhatsApp _chat.txt export parser.
 * Handles formats:
 *   [MM/DD/YY, HH:MM:SS AM/PM] Sender: Message
 *   [DD/MM/YYYY, HH:MM:SS] Sender: Message
 *   [YYYY-MM-DD, HH:MM:SS] Sender: Message
 *   [M/D/YY, H:MM AM/PM] Sender: Message
 */

// Regex to match WhatsApp message header: [date, time] Sender:
// Captures: dateString, timeString, sender
const HEADER_REGEX = /^\[(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]\s(.+?):\s/;

// Media message patterns — WhatsApp system labels for attachments
const MEDIA_PATTERNS = [
  /<Media omitted>/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /document omitted/i,
  /sticker omitted/i,
  /GIF omitted/i,
  // Arabic WhatsApp labels
  /\u062a\u0645 \u0627\u0644\u062d\u0630\u0641/i, // تم الحذف (omitted)
  /\u0635\u0648\u0631\u0629/i, // صورة (image)
  /\u0641\u064a\u062f\u064a\u0648/i, // فيديو (video)
  /\u0645\u0644\u0635\u0642/i, // ملصق (sticker)
  /\u0631\u0633\u0627\u0644\u0629 \u0635\u0648\u062a\u064a\u0629/i, // رسالة صوتية (voice message)
  /\u0645\u0633\u062a\u0646\u062f/i, // مستند (document)
  /\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062a\u064a\u0629/i, // مكالمة صوتية (voice call)
  /\u0645\u0643\u0627\u0644\u0645\u0629 \u0641\u064a\u062f\u064a\u0648/i, // مكالمة فيديو (video call)
  // Voice/video call system messages
  /voice call/i,
  /video call/i,
  /missed voice call/i,
  /missed video call/i,
];

// System message patterns to skip
const SYSTEM_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /changed the group/i,
  /changed this group/i,
  /added /i,
  /removed /i,
  /left the group/i,
  /left this group/i,
  /created group/i,
  /created this group/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /security code changed/i,
  /your security code/i,
];

// Emoji regex — Emoji_Presentation excludes ASCII digits which have the Emoji property
const EMOJI_REGEX = /\p{Emoji_Presentation}/gu;

function extractEmojis(text: string): string[] {
  const matches = text.match(EMOJI_REGEX);
  return matches || [];
}

function isMediaMessage(text: string): boolean {
  return MEDIA_PATTERNS.some((p) => p.test(text));
}

function isSystemMessage(text: string): boolean {
  return SYSTEM_PATTERNS.some((p) => p.test(text));
}

function parseDate(dateStr: string, timeStr: string): Date | null {
  // Normalize separators
  const normalized = dateStr.replace(/[\/\-.]/g, '/');

  // Try to determine format by looking at the parts
  const parts = normalized.split('/');
  if (parts.length !== 3) return null;

  // Try parsing with various strategies
  let month: number, day: number;

  // Attempt: MM/DD/YY or MM/DD/YYYY (US format - most common in WhatsApp exports)
  // WhatsApp typically uses the locale of the exporting device
  const fullDateStr = `${normalized} ${timeStr}`;

  // Try Date.parse first for standard formats
  const parsed = new Date(fullDateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Manual parsing: try to infer format
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);

  if (y < 100) y += 2000;

  // Strategy: if first part > 12, it must be DD/MM
  // If second part > 12, it must be MM/DD
  // If month is ambiguous (both <= 12), prefer MM/DD (US format)
  if (a > 12) {
    // DD/MM/YYYY
    day = a;
    month = b;
  } else if (b > 12) {
    // MM/DD/YYYY
    month = a;
    day = b;
  } else {
    // Ambiguous - default to MM/DD/YYYY
    month = a;
    day = b;
  }

  // Parse time
  const timeParts = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?(AM|PM|am|pm))?$/i);
  if (!timeParts) return null;

  let hours = parseInt(timeParts[1], 10);
  const minutes = parseInt(timeParts[2], 10);
  const seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
  const ampm = timeParts[4]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return new Date(y, month - 1, day, hours, minutes, seconds);
}

export function parseWhatsApp(raw: string): { messages: Message[]; errors: number } {
  const lines = raw.split('\n');
  const messages: Message[] = [];
  let errors = 0;
  let currentMessage: Partial<Message> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const match = line.match(HEADER_REGEX);

    if (match) {
      // Save previous message if exists
      if (currentMessage && currentMessage.sender && currentMessage.timestamp) {
        const text = (currentMessage.text || '').trim();
        if (!isSystemMessage(text)) {
          messages.push({
            sender: currentMessage.sender,
            text,
            timestamp: currentMessage.timestamp,
            isMedia: currentMessage.isMedia || false,
            emojis: currentMessage.emojis || [],
          });
        }
      }

      const [, dateStr, timeStr, sender] = match;
      const text = line.slice(match[0].length);
      const timestamp = parseDate(dateStr, timeStr);

      if (!timestamp) {
        errors++;
        currentMessage = null;
        continue;
      }

      currentMessage = {
        sender: sender.trim(),
        text,
        timestamp,
        isMedia: isMediaMessage(text),
        emojis: extractEmojis(text),
      };
    } else if (currentMessage) {
      // Continuation of previous message (multi-line)
      const trimmedLine = line.trim();
      // Skip empty continuation lines
      if (trimmedLine) {
        currentMessage.text = (currentMessage.text || '') + '\n' + trimmedLine;
        // Re-extract emojis from updated text
        currentMessage.emojis = extractEmojis(currentMessage.text || '');
        // Re-check media status
        if (!currentMessage.isMedia) {
          currentMessage.isMedia = isMediaMessage(currentMessage.text || '');
        }
      }
    }
  }

  // Save last message
  if (currentMessage && currentMessage.sender && currentMessage.timestamp) {
    const text = (currentMessage.text || '').trim();
    if (!isSystemMessage(text)) {
      messages.push({
        sender: currentMessage.sender,
        text,
        timestamp: currentMessage.timestamp,
        isMedia: currentMessage.isMedia || false,
        emojis: currentMessage.emojis || [],
      });
    }
  }

  return { messages, errors };
}
