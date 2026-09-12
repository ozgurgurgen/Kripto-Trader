import React from 'react';
import { SupportResistanceZone } from '../types/crypto';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface AutoSrZoneCardProps {
  zones: SupportResistanceZone[];
  currentPrice: number;
}

export const AutoSrZoneCard: React.FC<AutoSrZoneCardProps> = ({ zones, currentPrice }) => {
  const supports = zones.filter((z) => z.type === 'SUPPORT').sort((a, b) => b.price - a.price);
  const resistances = zones.filter((z) => z.type === 'RESISTANCE').sort((a, b) => a.price - b.price);

  const nearestSupport = supports.length > 0 ? supports[0] : null;
  const nearestResistance = resistances.length > 0 ? resistances[0] : null;

  return (
    <div className="bg-[#1e2329] border border-[#2b313a] rounded-xs p-3 flex flex-col gap-2.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2b313a]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xs bg-[#fcd535]/10 text-[#fcd535]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#eaecef]">Otomatik Destek & Direnç Radarı</h3>
            <p className="text-[10px] text-[#848e9c]">Pivot & Likidite Kümeleme Analizi</p>
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#181a20] text-[#848e9c] border border-[#2b313a] font-mono">
          {zones.length} Seviye
        </span>
      </div>

      {/* Proximity Alerts Banner */}
      {(nearestSupport?.isNear || nearestResistance?.isNear) && (
        <div className="flex items-center gap-2 p-2 rounded-xs bg-[#fcd535]/10 border border-[#fcd535]/30 text-[#fcd535] text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px]">
            {nearestSupport?.isNear && `Fiyat desteğe (%${nearestSupport.distancePct.toFixed(2)}) yaklaştı.`}
            {nearestResistance?.isNear && `Fiyat dirence (%${nearestResistance.distancePct.toFixed(2)}) yaklaştı.`}
          </span>
        </div>
      )}

      {/* Nearest Major Levels Overview */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-xs bg-[#181a20] border border-[#f6465d]/25">
          <div className="flex items-center justify-between text-[#f6465d] font-semibold text-[11px] mb-0.5">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Direnç
            </span>
            <span className="font-mono">
              +{nearestResistance ? nearestResistance.distancePct.toFixed(2) : 0}%
            </span>
          </div>
          <div className="text-sm font-bold font-mono text-[#eaecef]">
            ${nearestResistance ? nearestResistance.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 flex justify-between">
            <span>Güç: %{nearestResistance?.strengthScore || 0}</span>
            <span>{nearestResistance?.touches || 0} Temas</span>
          </div>
        </div>

        <div className="p-2 rounded-xs bg-[#181a20] border border-[#0ecb81]/25">
          <div className="flex items-center justify-between text-[#0ecb81] font-semibold text-[11px] mb-0.5">
            <span className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Destek
            </span>
            <span className="font-mono">
              -{nearestSupport ? nearestSupport.distancePct.toFixed(2) : 0}%
            </span>
          </div>
          <div className="text-sm font-bold font-mono text-[#eaecef]">
            ${nearestSupport ? nearestSupport.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 flex justify-between">
            <span>Güç: %{nearestSupport?.strengthScore || 0}</span>
            <span>{nearestSupport?.touches || 0} Temas</span>
          </div>
        </div>
      </div>

      {/* All Zones List */}
      <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
        {zones.map((zone) => {
          const isSupport = zone.type === 'SUPPORT';
          return (
            <div
              key={zone.id}
              className={`flex items-center justify-between px-2 py-1 rounded-xs border text-[11px] ${
                isSupport
                  ? 'bg-[#181a20] border-[#0ecb81]/20 text-[#0ecb81]'
                  : 'bg-[#181a20] border-[#f6465d]/20 text-[#f6465d]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSupport ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'
                  }`}
                />
                <span className="font-mono font-medium">
                  ${zone.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-[#848e9c]">
                  ({isSupport ? 'Destek' : 'Direnç'})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-12 bg-[#2b313a] rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full ${isSupport ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'}`}
                    style={{ width: `${zone.strengthScore}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] w-10 text-right">
                  {zone.distancePct > 0 ? (isSupport ? `-${zone.distancePct.toFixed(1)}%` : `+${zone.distancePct.toFixed(1)}%`) : '0%'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
