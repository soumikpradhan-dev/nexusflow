import React from 'react';
import { NODE_PALETTE_ITEMS } from '../../utils/constants';
import { Radio, Activity, Sliders, TrendingUp, Zap, GitMerge, MessageSquare, ShieldAlert, Layers } from 'lucide-react';

const ICON_MAP = {
  Radio,
  Activity,
  Sliders,
  TrendingUp,
  Zap,
  GitMerge,
  MessageSquare,
  ShieldAlert
};

export default function NodePalette() {
  const onDragStart = (event, item) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = ['Source', 'Transform', 'Rules', 'Action'];

  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
        <Layers className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Pipeline Blocks</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map(category => {
          const items = NODE_PALETTE_ITEMS.filter(it => it.category === category);
          return (
            <div key={category} className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                {category} Nodes
              </div>
              <div className="space-y-2">
                {items.map(item => {
                  const Icon = ICON_MAP[item.icon] || Activity;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      className={`group flex cursor-grab items-start gap-3 rounded-lg border bg-gradient-to-r p-2.5 transition-all hover:scale-[1.02] hover:shadow-lg active:cursor-grabbing ${item.color} bg-slate-950/60`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-700/60">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-800 p-3 bg-slate-950/60">
        <div className="text-[11px] text-slate-400 text-center">
          💡 Drag & drop any node onto the canvas to construct your reactive data pipeline.
        </div>
      </div>
    </div>
  );
}
