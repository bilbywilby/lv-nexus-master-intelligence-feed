import { motion } from 'framer-motion';
import type { FeedItem } from '@shared/types';
import { cn } from '@/lib/utils';
const MAP_BOUNDS = {
  latMin: 40.5,
  latMax: 40.8,
  lonMin: -75.6,
  lonMax: -75.1,
};
const CITIES = [
  { name: 'Allentown', lat: 40.6084, lon: -75.4902 },
  { name: 'Bethlehem', lat: 40.6259, lon: -75.3705 },
  { name: 'Easton', lat: 40.6918, lon: -75.2218 },
];
const getPosition = (lat: number, lon: number) => {
  const x = ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * 100;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * 100;
  return { x, y };
};
const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-500',
  Low: 'bg-yellow-500',
  Info: 'bg-sky-500',
};
export function NexusMap({ items, selectedItem, onSelectItem, onClickItem }: { items: FeedItem[], selectedItem: FeedItem | null, onSelectItem: (item: FeedItem | null) => void, onClickItem: (item: FeedItem) => void }) {
  return (
    <div className="w-full h-full bg-slate-800/20 relative overflow-hidden border-t border-slate-700/50">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="grid-map" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(60, 80, 110, 0.3)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-map)" />
      </svg>
      <div className="absolute inset-0">
        {CITIES.map(city => {
          const { x, y } = getPosition(city.lat, city.lon);
          return (
            <div key={city.name} style={{ left: `${x}%`, top: `${y}%` }} className="absolute transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-xs text-slate-500 font-sans">{city.name}</div>
            </div>
          );
        })}
        {items.map(item => {
          const { x, y } = getPosition(item.coords.lat, item.coords.lon);
          const isSelected = selectedItem?.id === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              onMouseEnter={() => onSelectItem(item)}
              onMouseLeave={() => onSelectItem(null)}
              onClick={() => onClickItem(item)}
            >
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                SEVERITY_COLORS[item.severity],
                isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : 'ring-1 ring-black/50'
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-full",
                  SEVERITY_COLORS[item.severity],
                  item.severity === 'Critical' ? 'animate-ping' : 'opacity-50'
                )}></div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-md border border-slate-700 text-sm shadow-lg pointer-events-none"
        >
          <p className="font-bold text-amber-400">{selectedItem.title}</p>
          <p className="text-slate-300">{selectedItem.location}</p>
          <p className="text-xs text-slate-400">{new Date(selectedItem.timestamp).toLocaleString()}</p>
        </motion.div>
      )}
    </div>
  );
}