import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem, Severity } from '@shared/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: 'border-red-500/50 text-red-300',
  High: 'border-orange-500/50 text-orange-300',
  Medium: 'border-amber-500/50 text-amber-300',
  Low: 'border-yellow-500/50 text-yellow-300',
  Info: 'border-sky-500/50 text-sky-300',
};
export function FeedTicker({ items, onSelectItem, onClickItem }: { items: FeedItem[], onSelectItem: (item: FeedItem) => void, onClickItem: (item: FeedItem) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="pr-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                "mb-2 p-3 border-l-4 bg-slate-800/30 hover:bg-slate-800/60 transition-colors cursor-pointer",
                SEVERITY_STYLES[item.severity]
              )}
              onMouseEnter={() => onSelectItem(item)}
              onClick={() => onClickItem(item)}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold flex-grow flex items-center">
                  <span>{item.title}</span>
                  {item.summary && (
                    <Badge className="ml-2 bg-amber-500/30 text-amber-300 text-xs border-amber-500/50">AI</Badge>
                  )}
                </p>
                <p className="text-xs text-slate-400 flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
              <p className="text-xs text-slate-400">{item.location}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}