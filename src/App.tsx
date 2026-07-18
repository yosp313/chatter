import { AnimatePresence } from 'framer-motion';
import { useChatAnalysis } from './hooks/useChatAnalysis';
import UploadZone from './components/UploadZone';
import Dashboard from './components/Dashboard';
import AdSenseScript from './components/AdSenseScript';

export default function App() {
  const { parsedData, analysis, isLoading, error, handleFile, reset } =
    useChatAnalysis();

  return (
    <div className="min-h-screen bg-chatter-bg">
      <AdSenseScript />

      <AnimatePresence mode="wait">
        {analysis && parsedData ? (
          <Dashboard
            key="dashboard"
            analysis={analysis}
            parsedData={parsedData}
            onReset={reset}
          />
        ) : (
          <UploadZone
            key="upload"
            onFile={handleFile}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-chatter-error/90 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3">
            <span>⚠️</span>
            <span className="text-sm">{error}</span>
            <button
              onClick={reset}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
