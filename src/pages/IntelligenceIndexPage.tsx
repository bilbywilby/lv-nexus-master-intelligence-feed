import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { LiveFeedResponse, FeedItem, Severity } from '@shared/types';
import { NavHeader } from '@/components/NavHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FeedDrillDownSheet } from '@/components/dashboard/FeedDrillDownSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/50",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  Low: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  Info: "bg-sky-500/20 text-sky-300 border-sky-500/50",
};
const INCIDENT_TYPES = ['TRAFFIC', 'EMERGENCY', 'INFRASTRUCTURE', 'WEATHER', 'AUTOMATION'];
export function IntelligenceIndexPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);
  const { data, error, isLoading, refetch } = useQuery<LiveFeedResponse>({
    queryKey: ['liveFeed'],
    queryFn: () => api('/api/feed/live'),
    refetchOnWindowFocus: false,
  });
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(item => {
      const searchMatch = searchTerm.length === 0 ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const severityMatch = severityFilter === 'all' || item.severity === severityFilter;
      const typeMatch = typeFilter === 'all' || item.type === typeFilter;
      return searchMatch && severityMatch && typeMatch;
    });
  }, [data, searchTerm, severityFilter, typeFilter]);
  const handleItemClick = (item: FeedItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };
  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32 bg-slate-800" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 bg-slate-800" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 bg-slate-800" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12 bg-slate-800" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48 bg-slate-800" /></TableCell>
          <TableCell><Skeleton className="h-4 w-64 bg-slate-800" /></TableCell>
        </TableRow>
      ));
    }
    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-red-400">
            <div className="flex items-center justify-center gap-2">
              <ServerCrash className="h-5 w-5" />
              <span>Failed to load intelligence data.</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return filteredItems.map(item => (
      <TableRow
        key={item.id}
        className="cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => handleItemClick(item)}
      >
        <TableCell className="font-mono text-xs text-slate-400">{format(new Date(item.timestamp), 'HH:mm:ss.SSS')}</TableCell>
        <TableCell><Badge variant="outline" className={cn(SEVERITY_STYLES[item.severity])}>{item.severity}</Badge></TableCell>
        <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
        <TableCell>{item.summary ? <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 text-xs">AI</Badge> : '-'}</TableCell>
        <TableCell className="font-medium text-slate-200">{item.title}</TableCell>
        <TableCell className="text-slate-300">{item.location}</TableCell>
      </TableRow>
    ));
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      <div className="scanline"></div>
      <NavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 pt-24">
        <h1 className="text-3xl font-bold text-amber-400 tracking-wider mb-6">INTELLIGENCE INDEX</h1>
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-emerald-400">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-slate-700 placeholder:text-slate-500"
            />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="Filter by severity..." /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="Filter by type..." /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="all">All Types</SelectItem>
                {INCIDENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-emerald-400">Event Log</CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800">Refresh</Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] border border-slate-800 rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-slate-800">
                    <TableHead className="w-[120px]">Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderContent()}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <footer className="absolute bottom-2 right-4 text-xs text-slate-600 z-10">
        Built with ❤️ at Cloudflare
      </footer>
      <FeedDrillDownSheet open={isSheetOpen} onOpenChange={setSheetOpen} item={selectedItem} />
    </div>
  );
}