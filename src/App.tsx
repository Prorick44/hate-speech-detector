import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Loader2, Sparkles, X } from 'lucide-react';
import { supabase, type Detection } from '@/lib/supabase';
import { detectHateSpeech, type DetectionResult } from '@/lib/detector';
import ResultCard from '@/components/ResultCard';
import HistoryPanel from '@/components/HistoryPanel';
import StatsBar from '@/components/StatsBar';

const MAX_LENGTH = 500;

const exampleStatements = [
  'I think everyone deserves equal rights regardless of their background.',
  'All people from that country are criminals and should be deported.',
  'The weather is really nice today, perfect for a walk in the park.',
  'People with that condition are a burden on society.',
];

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('detections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError('Could not load history.');
      return;
    }
    setHistory(data ?? []);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleAnalyze = async () => {
    const text = input.trim();
    if (!text) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    await new Promise((r) => setTimeout(r, 600));

    const detection = detectHateSpeech(text);

    const { error: insertError } = await supabase.from('detections').insert({
      statement: text,
      is_hateful: detection.isHateful,
      confidence: detection.confidence,
      categories: detection.categories,
      severity: detection.severity,
      explanation: detection.explanation,
      flagged_terms: detection.flaggedTerms,
    });

    if (insertError) {
      setError('Could not save detection to history.');
    }

    setResult(detection);
    setAnalyzing(false);
    loadHistory();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('detections').delete().eq('id', id);
    if (!error) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleSelectHistory = (item: Detection) => {
    setResult({
      isHateful: item.is_hateful,
      confidence: Number(item.confidence),
      categories: item.categories ?? [],
      severity: item.severity as DetectionResult['severity'],
      explanation: item.explanation ?? '',
      flaggedTerms: item.flagged_terms ?? [],
    });
    setInput(item.statement);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExample = (text: string) => {
    setInput(text);
    setResult(null);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const hatefulCount = history.filter((h) => h.is_hateful).length;
  const safeCount = history.length - hatefulCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Hate Speech Detector</h1>
            <p className="text-xs text-gray-500">Analyze statements for hateful content</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles size={14} />
            <span>Powered by pattern-based NLP</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatsBar total={history.length} hateful={hatefulCount} safe={safeCount} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter a statement to analyze
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Type or paste a statement here..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAnalyze();
                }
              }}
            />
            {input && (
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400 tabular-nums">
              {input.length} / {MAX_LENGTH}
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-gray-400">
                Ctrl+Enter to analyze
              </span>
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || analyzing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {result && <ResultCard result={result} />}

        {!result && !analyzing && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Try an example</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exampleStatements.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(ex)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <HistoryPanel
          history={history}
          onSelect={handleSelectHistory}
          onDelete={handleDelete}
        />

        <footer className="text-center py-4">
          <p className="text-xs text-gray-400">
            This tool uses pattern-based detection and is for educational purposes. It is not a substitute for professional content moderation.
          </p>
        </footer>
      </main>
    </div>
  );
}
