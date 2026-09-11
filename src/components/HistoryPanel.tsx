import { History, Trash2, Clock } from 'lucide-react';
import type { Detection } from '@/lib/supabase';

type Props = {
  history: Detection[];
  onSelect: (detection: Detection) => void;
  onDelete: (id: string) => void;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function HistoryPanel({ history, onSelect, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <History size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-800">Detection History</h3>
        <span className="ml-auto text-sm text-gray-400">{history.length} entries</span>
      </div>

      {history.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Clock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No detections yet. Analyze a statement to get started.</p>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3"
            >
              <div
                className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.is_hateful ? 'bg-red-500' : 'bg-green-500'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{item.statement}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.is_hateful ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                  >
                    {item.is_hateful ? 'Hateful' : 'Safe'}
                  </span>
                  <span className="text-xs text-gray-400">{item.confidence}%</span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(item.created_at)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
