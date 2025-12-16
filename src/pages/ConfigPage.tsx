import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { NavHeader } from '@/components/NavHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, PlusCircle, ServerCrash } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import { StatSparkline } from '@/components/dashboard/StatSparkline';
interface FeedConfig {
  frequency: number;
  chaos: boolean;
}
interface ApiKey {
  id: string;
  key: string;
  createdAt: string;
}
const generateApiKey = (): ApiKey => ({
  id: uuidv4(),
  key: `lv-nexus-sk-${crypto.randomUUID().replace(/-/g, '')}`,
  createdAt: new Date().toISOString(),
});
export function ConfigPage() {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<FeedConfig | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([generateApiKey()]);
  const { data: configData, isLoading, error } = useQuery<FeedConfig>({
    queryKey: ['feedConfig'],
    queryFn: () => api('/api/feed/config'),
    staleTime: Infinity,
  });
  useEffect(() => {
    if (configData) {
      setLocalConfig(configData);
    }
  }, [configData]);
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: FeedConfig) => api('/api/feed/config', {
      method: 'POST',
      body: JSON.stringify(newConfig),
    }),
    onSuccess: () => {
      toast.success('Configuration updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['feedConfig'] });
      queryClient.invalidateQueries({ queryKey: ['liveFeed'] });
    },
    onError: () => {
      toast.error('Failed to update configuration.');
    },
  });
  const handleConfigChange = (key: keyof FeedConfig, value: number | boolean) => {
    if (localConfig) {
      const newConfig = { ...localConfig, [key]: value };
      setLocalConfig(newConfig);
      updateConfigMutation.mutate(newConfig);
    }
  };
  const handleAddApiKey = () => {
    setApiKeys(prev => [...prev, generateApiKey()]);
    toast.info('New API key generated.');
  };
  const handleDeleteApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast.error('API key revoked.');
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      <div className="scanline"></div>
      <NavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 pt-24">
        <h1 className="text-3xl font-bold text-amber-400 tracking-wider mb-8">SYSTEM CONFIGURATION</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-400">Simulation Controls</CardTitle>
                <CardDescription className="text-slate-400">Adjust real-time event generation parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                ) : error ? (
                   <div className="text-red-400 flex items-center gap-2"><ServerCrash size={16} /> Failed to load</div>
                ) : localConfig && (
                  <>
                    <div className="space-y-4">
                      <Label htmlFor="frequency" className="flex justify-between text-slate-300">
                        <span>Event Frequency</span>
                        <span className="text-amber-400">{localConfig.frequency} events/tick</span>
                      </Label>
                      <Slider
                        id="frequency"
                        min={0}
                        max={5}
                        step={1}
                        value={[localConfig.frequency]}
                        onValueChange={(value) => handleConfigChange('frequency', value[0])}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="chaos-mode" className="text-slate-300">
                        <p>Chaos Mode</p>
                        <p className="text-xs text-slate-500">Increases event velocity & severity.</p>
                      </Label>
                      <Switch
                        id="chaos-mode"
                        checked={localConfig.chaos}
                        onCheckedChange={(checked) => handleConfigChange('chaos', checked)}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Live Velocity Preview</Label>
                      <div className="h-[60px] mt-2 p-2 bg-slate-900/50 rounded-md">
                         <StatSparkline data={Array(60).fill(0).map(() => Math.random() * (localConfig.frequency + (localConfig.chaos ? 3 : 0)))} />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-emerald-400">API Key Management</CardTitle>
                    <CardDescription className="text-slate-400">Manage access keys for the intelligence feed API.</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddApiKey}><PlusCircle className="mr-2 h-4 w-4" /> Generate Key</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-800 rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-slate-800">
                        <TableHead>API Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(apiKey => (
                        <TableRow key={apiKey.id} className="border-slate-800">
                          <TableCell className="font-mono text-xs text-slate-300">{apiKey.key}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-400" onClick={() => handleDeleteApiKey(apiKey.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="absolute bottom-2 right-4 text-xs text-slate-600 z-10">
        Built with ❤��� at Cloudflare
      </footer>
    </div>
  );
}