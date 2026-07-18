import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onFile: (file: File) => void;
  isLoading: boolean;
}

export default function UploadZone({ onFile, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-5xl font-bold text-chatter-accent mb-3">Chatter</h1>
        <p className="text-chatter-text-muted text-lg max-w-md">
          Transform your WhatsApp chat logs into a beautiful, interactive dashboard.
          All data stays in your browser — nothing is uploaded.
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg"
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
            transition-all duration-300
            ${
              isDragging
                ? 'border-chatter-accent bg-chatter-accent/10 scale-[1.02]'
                : 'border-chatter-border hover:border-chatter-accent/50 hover:bg-chatter-card/50'
            }
            ${isLoading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt"
            onChange={handleInputChange}
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-chatter-border border-t-chatter-accent rounded-full animate-spin" />
              <p className="text-chatter-text-muted">Parsing your chat log...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl mb-2">📁</div>
              <p className="text-xl font-semibold text-chatter-text">
                Drop your chat file here
              </p>
              <p className="text-chatter-text-muted text-sm">or click to browse</p>

              {/* Format badges */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-chatter-card text-chatter-accent border border-chatter-accent/30">
                  WhatsApp
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-chatter-card text-chatter-text-muted border border-chatter-border">
                  Telegram
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-chatter-card text-chatter-text-muted border border-chatter-border">
                  Discord
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-chatter-card text-chatter-text-muted border border-chatter-border">
                  Signal
                </span>
              </div>

              <p className="text-chatter-text-muted/60 text-xs mt-4">
                Supported: WhatsApp _chat.txt (others coming soon)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Security notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-xs text-chatter-text-muted/40 flex items-center gap-2"
      >
        <span>🔒</span>
        All processing is done locally in your browser. No data is ever uploaded.
      </motion.p>
    </div>
  );
}
