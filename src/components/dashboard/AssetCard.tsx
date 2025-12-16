import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Eye, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedItem } from '@shared/types';
export function AssetCard({ item }: { item: FeedItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleDownload = () => {
    window.open(item.location, '_blank');
  };
  return (
    <div className="p-4 rounded-lg bg-slate-900/70 border border-amber-500/30 shadow-lg shadow-amber-500/10 relative overflow-hidden">
      <div className="absolute -top-1 -right-1 w-16 h-16 bg-amber-500/20 rounded-full blur-2xl"></div>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
          <FileText className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-300">PDF Document Identified</p>
          <a href={item.location} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 truncate hover:underline">
            {item.location}
          </a>
        </div>
      </div>
      <div className="mt-4 pl-2 border-l-2 border-amber-500/30">
        <div className="flex items-center gap-2 mb-2 ml-3">
          <Cpu size={16} className="text-amber-400" />
          <h4 className="text-md font-semibold text-amber-300">AI-Generated Brief</h4>
        </div>
        <p className="text-sm text-slate-300 ml-3">{item.summary}</p>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-slate-950/50 p-3 rounded-md">
              <p className="text-xs text-slate-400 mb-2">Mock Document Preview:</p>
              <pre className="text-xs text-emerald-300 bg-black/30 p-2 rounded"><code>
                {`Title: Lehigh Valley Infrastructure Report\nDate: ${new Date().toLocaleDateString()}\nStatus: Active\n\nSummary:\nThis document outlines key infrastructure updates...\n`}
              </code></pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" onClick={() => setIsExpanded(!isExpanded)}>
          <Eye className="mr-2 h-4 w-4" />
          {isExpanded ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}