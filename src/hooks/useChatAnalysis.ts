import { useState, useCallback } from 'react';
import type { ChatAnalysis, ParsedData } from '../types';
import { parseWhatsApp } from '../parsers/whatsapp';
import { analyzeMessages } from '../lib/analyze';

export interface UseChatAnalysisReturn {
  parsedData: ParsedData | null;
  analysis: ChatAnalysis | null;
  isLoading: boolean;
  error: string | null;
  handleFile: (file: File) => void;
  reset: () => void;
}

export function useChatAnalysis(): UseChatAnalysisReturn {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedData(null);
    setAnalysis(null);

    try {
      // Validate file
      if (!file.name.endsWith('.txt')) {
        throw new Error('Please upload a WhatsApp _chat.txt export file (.txt)');
      }

      const text = await file.text();

      if (!text || text.trim().length === 0) {
        throw new Error('The file appears to be empty');
      }

      // Parse
      const { messages, errors } = parseWhatsApp(text);

      if (messages.length === 0) {
        throw new Error(
          'Could not parse any messages from this file. Make sure it\'s a WhatsApp _chat.txt export.'
        );
      }

      // Analyze
      const result = analyzeMessages(messages);

      setParsedData({ messages, fileName: file.name, parseErrors: errors });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedData(null);
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parsedData,
    analysis,
    isLoading,
    error,
    handleFile,
    reset,
  };
}
