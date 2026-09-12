import React from 'react';
import { 
  MousePointer, 
  TrendingUp, 
  Minus, 
  Square, 
  Type, 
  Trash2,
  GitCommit,
  Bell
} from 'lucide-react';

export type DrawingTool = 'cursor' | 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle' | 'text' | 'alert';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  onClearDrawings: () => void;
  drawingCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearDrawings,
  drawingCount,
}) => {
  const tools = [
    { id: 'cursor', label: 'İmleç / Kaydır', icon: MousePointer },
    { id: 'alert', label: 'Fiyat Alarmı Ekle (Tıkla ve Kur)', icon: Bell },
    { id: 'trendline', label: 'Trend Çizgisi', icon: TrendingUp },
    { id: 'horizontal', label: 'Yatay Destek / Direnç', icon: Minus },
    { id: 'fibonacci', label: 'Fibonacci Düzeltmesi', icon: GitCommit },
    { id: 'rectangle', label: 'Bölge / Dikdörtgen', icon: Square },
    { id: 'text', label: 'Not / Metin', icon: Type },
  ];

  return (
    <div className="flex items-center gap-1 bg-[#121722]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            title={t.label}
            onClick={() => onSelectTool(t.id as DrawingTool)}
            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
              isActive
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      {drawingCount > 0 && (
        <>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button
            onClick={onClearDrawings}
            title={`Çizimleri Temizle (${drawingCount})`}
            className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
