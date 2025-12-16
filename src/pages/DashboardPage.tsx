import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2, Globe, ServerCrash, Rss } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LiveFeedResponse, FeedItem } from '@shared/types';
import { NexusMap } from '@/components/dashboard/NexusMap';
import { FeedTicker } from '@/components/dashboard/FeedTicker';
import { StatSparkline } from '@/components/dashboard/StatSparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
const StatCard = ({ title, value, icon, children }: { title: string; value: string | number; icon: React.ReactNode; children?: React.ReactNode }) => (
  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
      <div className="text-slate-400">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-amber-400">{value}</div>
      {children}
    </CardContent>
  </Card>
);
const LoadingSkeleton = () => (
  <div className="grid gap-4 p-4 md:p-6 lg:p-8 grid-cols-12 grid-rows-6 h-full">
    <Skeleton className="col-span-12 row-span-4 lg:col-span-8 lg:row-span-6 bg-slate-800/50" />
    <Skeleton className="col-span-12 row-span-2 lg:col-span-4 lg:row-span-6 bg-slate-800/50" />
  </div>
);
export function DashboardPage() {
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<LiveFeedResponse>({
    queryKey: ['liveFeed'],
    queryFn: () => api('/api/feed/live'),
    refetchInterval: 2500,
    staleTime: 2000,
  });
  const handleReset = async () => {
    await api('/api/feed/reset', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['liveFeed'] });
  };
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-400 bg-slate-950">
        <ServerCrash className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold">Connection Lost</h1>
        <p className="text-slate-400">Failed to connect to the Nexus Intelligence Feed.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry Connection</Button>
      </div>
    );
  }
  const stats = data?.stats;
  const feedItems = data?.items ?? [];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      <div className="scanline"></div>
      <ThemeToggle className="absolute top-4 right-4 text-slate-400 hover:text-amber-400" />
      <main className="max-w-[100rem] mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400 tracking-wider">LV-NEXUS</h1>
            <p className="text-sm text-emerald-400">MASTER INTELLIGENCE FEED</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">SYSTEM STATUS:</div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              NOMINAL
            </div>
          </div>
        </header>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-12 grid-rows-[auto] gap-4 md:gap-6 h-[calc(100vh-120px)]"
        >
          <motion.div
            layout
            className="col-span-12 lg:col-span-8 row-span-1 lg:row-span-2"
          >
            <Card className="h-full bg-slate-900/50 border-slate-700/50 backdrop-blur-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2"><Globe size={18} /> GEO-SPATIAL VIEW</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 relative">
                <NexusMap items={feedItems} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            layout
            className="col-span-12 lg:col-span-4 row-span-1 lg:row-span-2"
          >
            <Card className="h-full bg-slate-900/50 border-slate-700/50 backdrop-blur-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2"><Rss size={18} /> LIVE FEED</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden">
                <FeedTicker items={feedItems} onSelectItem={setSelectedItem} />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div layout className="col-span-6 md:col-span-3 lg:col-span-2">
            <StatCard title="CRITICAL ALERTS" value={stats?.critical ?? 0} icon={<AlertTriangle className="h-4 w-4" />} />
          </motion.div>
          <motion.div layout className="col-span-6 md:col-span-3 lg:col-span-2">
            <StatCard title="TOTAL EVENTS" value={stats?.total ?? 0} icon={<BarChart2 className="h-4 w-4" />} />
          </motion.div>
          <motion.div layout className="col-span-12 md:col-span-6 lg:col-span-4">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">EVENT VELOCITY (LAST HOUR)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[60px]">
                <StatSparkline data={stats?.eventsLastHour ?? []} />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div layout className="col-span-12 lg:col-span-4 flex items-center justify-end">
             <Button variant="destructive" size="sm" onClick={handleReset}>Reset Simulation</Button>
          </motion.div>
        </motion.div>
      </main>
      <footer className="absolute bottom-2 right-4 text-xs text-slate-600 z-10">
        Built with ���️ at Cloudflare
      </footer>
    </div>
  );
}