import { AlertTriangle, CheckCircle2, ShieldAlert, Tag, Gauge } from 'lucide-react';
import type { DetectionResult } from '@/lib/detector';
import DetectionMeter from './DetectionMeter';

type Props = {
  result: DetectionResult;
};

const severityConfig = {
  none: { label: 'None', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200' },
  low: { label: 'Low', color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  moderate: { label: 'Moderate', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200' },
  high: { label: 'High', color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200' },
  severe: { label: 'Severe', color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function ResultCard({ result }: Props) {
  const sev = severityConfig[result.severity];

  return (
    <div className="animate-[fadeIn_0.4s_ease-out]">
      <div
        className={`rounded-2xl border-2 p-6 ${result.isHateful ? sev.bg + ' ' + sev.border : 'bg-green-50 border-green-200'}`}
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${result.isHateful ? 'bg-white' : 'bg-white'}`}
          >
            {result.isHateful ? (
              <ShieldAlert size={32} style={{ color: sev.color }} />
            ) : (
              <CheckCircle2 size={32} className="text-green-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-2xl font-bold ${result.isHateful ? '' : 'text-green-700'}`} style={result.isHateful ? { color: sev.color } : undefined}>
              {result.isHateful ? 'Hateful Content Detected' : 'No Hate Speech Detected'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {result.isHateful
                ? `Severity: ${sev.label}`
                : 'This statement appears to be safe.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center bg-white/60 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
              <Gauge size={16} />
              Confidence Score
            </div>
            <DetectionMeter value={result.confidence} isHateful={result.isHateful} />
          </div>

          <div className="flex flex-col gap-3">
            {result.categories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Tag size={14} />
                  Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: sev.color }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.flaggedTerms.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <AlertTriangle size={14} />
                  Flagged Terms
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.flaggedTerms.slice(0, 8).map((term, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-red-100 text-red-700 border border-red-200"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.isHateful && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Severity Level
                </div>
                <div className="flex items-center gap-2">
                  {(['low', 'moderate', 'high', 'severe'] as const).map((level) => {
                    const config = severityConfig[level];
                    const reached =
                      ['low', 'moderate', 'high', 'severe'].indexOf(result.severity) >=
                      ['low', 'moderate', 'high', 'severe'].indexOf(level);
                    return (
                      <div
                        key={level}
                        className="flex-1 h-2 rounded-full transition-colors duration-500"
                        style={{
                          backgroundColor: reached ? config.color : '#e5e7eb',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="text-sm font-medium mt-1.5" style={{ color: sev.color }}>
                  {sev.label}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-200/60">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Analysis
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
        </div>
      </div>
    </div>
  );
}
