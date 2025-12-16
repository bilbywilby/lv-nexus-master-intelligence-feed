import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Node, Edge, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NavHeader } from '@/components/NavHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadCloud, Play, Loader2, Save } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { N8nWorkflow, WorkflowEntityState, AutomationRunResponse } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
const sampleWorkflow: N8nWorkflow = {
  name: "Sample: Find PDFs in Sitemap",
  nodes: [
    { id: 'start', type: 'startNode', name: 'Start', parameters: {}, position: [150, 50] },
    { id: 'http', type: 'customNode', name: 'HTTP Request', parameters: { url: 'https://example.com/sitemap.xml' }, position: [150, 200] },
    { id: 'xml', type: 'customNode', name: 'XML', parameters: { mode: 'parse' }, position: [150, 350] },
    { id: 'filter', type: 'customNode', name: 'Filter PDFs', parameters: { condition: "endsWith('.pdf')" }, position: [150, 500] },
  ],
  connections: {
    start: { main: [[{ node: 'http' }]] },
    http: { main: [[{ node: 'xml' }]] },
    xml: { main: [[{ node: 'filter' }]] },
  },
};
const StartNode = () => (
  <div className="w-20 h-20 rounded-full bg-slate-900/50 border-2 border-blue-500/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-blue-500/20">
    <div className="w-16 h-16 rounded-full bg-blue-500/30 animate-pulse flex items-center justify-center text-xs font-bold text-blue-200">
      START
    </div>
  </div>
);
const CustomNode = ({ data }: { data: { name: string, parameters: any, type: string } }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("w-48 p-3 rounded-md bg-slate-900/50 border border-emerald-500/50 backdrop-blur-sm shadow-lg shadow-emerald-500/10",
          data.name.includes('Filter') && "border-amber-500/50 shadow-amber-500/10"
        )}>
          <div className="font-bold text-sm text-emerald-300">{data.name}</div>
          <div className="text-xs text-slate-400 truncate">{Object.values(data.parameters).join(', ')}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
        <pre className="text-xs"><code>{JSON.stringify(data.parameters, null, 2)}</code></pre>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
const nodeTypes = { startNode: StartNode, customNode: CustomNode };
const SCHEDULE_PRESETS = [
  { label: '1 Minute', value: '1', minutes: 1 },
  { label: '5 Minutes', value: '5', minutes: 5 },
  { label: '1 Hour', value: '60', minutes: 60 },
  { label: '6 Hours', value: '360', minutes: 360 },
  { label: '1 Day', value: '1440', minutes: 1440 },
  { label: 'Weekly', value: '10080', minutes: 10080 },
];
export function AutomationCanvas() {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowEntityState | null>(null);
  const [localMinutes, setLocalMinutes] = useState(60);
  const [localEnabled, setLocalEnabled] = useState(false);
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<{ items: WorkflowEntityState[] }>({
    queryKey: ['workflows'],
    queryFn: () => api('/api/automation/workflows'),
    refetchInterval: 10000,
  });
  const importMutation = useMutation({
    mutationFn: (workflow: N8nWorkflow) => api<{ id: string }>('/api/automation/workflows', { method: 'POST', body: JSON.stringify(workflow) }),
    onSuccess: () => {
      toast.success('Workflow imported successfully.');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => toast.error('Failed to import workflow.'),
  });
  const runMutation = useMutation({
    mutationFn: (id: string) => api<AutomationRunResponse>(`/api/automation/run/${id}`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data.summary);
      queryClient.invalidateQueries({ queryKey: ['liveFeed'] });
    },
    onError: () => toast.error('Workflow execution failed.'),
  });
  const saveScheduleMutation = useMutation({
    mutationFn: (body: { scheduleIntervalMs: number; enabled: boolean }) =>
      api(`/api/automation/workflows/${selectedWorkflow!.id}/schedule`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Schedule saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => toast.error('Failed to save schedule.'),
  });
  useEffect(() => {
    if (workflows && workflows.items.length === 0 && !isLoadingWorkflows) {
      importMutation.mutate(sampleWorkflow);
    }
  }, [workflows, isLoadingWorkflows, importMutation]);
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const loadWorkflow = useCallback((wfState: WorkflowEntityState) => {
    setSelectedWorkflow(wfState);
    const { nodes: wfNodes, connections } = wfState.workflow;
    const flowNodes: Node[] = wfNodes.map(n => ({
      id: n.id,
      type: n.type === 'n8n-nodes-base.start' ? 'startNode' : 'customNode',
      position: { x: n.position[0], y: n.position[1] },
      data: { name: n.name, parameters: n.parameters, type: n.type },
    }));
    const flowEdges: Edge[] = [];
    Object.entries(connections).forEach(([sourceId, outputs]) => {
      outputs.main.forEach(outputGroup => {
        outputGroup.forEach(connection => {
          flowEdges.push({
            id: `${sourceId}-${connection.node}`,
            source: sourceId,
            target: connection.node,
            animated: true,
            style: { stroke: '#059669' },
          });
        });
      });
    });
    setNodes(flowNodes);
    setEdges(flowEdges);
    setLocalMinutes(wfState.scheduleIntervalMs ? Math.round(wfState.scheduleIntervalMs / 60000) : 60);
    setLocalEnabled(wfState.enabled || false);
  }, [setNodes, setEdges]);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          importMutation.mutate(json);
        } catch (error) {
          toast.error("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };
  const handleSaveSchedule = () => {
    if (selectedWorkflow) {
      saveScheduleMutation.mutate({
        scheduleIntervalMs: localMinutes * 60000,
        enabled: localEnabled,
      });
    }
  };
  const handlePresetChange = (value: string) => {
    const preset = SCHEDULE_PRESETS.find(p => p.value === value);
    if (preset) {
      setLocalMinutes(preset.minutes);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      <div className="scanline"></div>
      <NavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 pt-24">
        <h1 className="text-3xl font-bold text-amber-400 tracking-wider mb-8">AUTOMATION INTEL</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[75vh]">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm flex-grow flex flex-col">
              <CardHeader>
                <CardTitle className="text-emerald-400">Workflows</CardTitle>
                <CardDescription className="text-slate-400">Saved automation workflows.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-slate-800">
                      <TableHead>Name</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWorkflows && <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>}
                    {workflows?.items.map(wf => (
                      <TableRow key={wf.id} onClick={() => loadWorkflow(wf)} className={cn("cursor-pointer hover:bg-slate-800/50", selectedWorkflow?.id === wf.id && "bg-slate-800/70")}>
                        <TableCell className="font-medium text-slate-200">{wf.workflow.name || 'Untitled Workflow'}</TableCell>
                        <TableCell className="text-xs text-slate-400">{wf.scheduleIntervalMs ? `${Math.round(wf.scheduleIntervalMs / 60000)}m` : 'None'}</TableCell>
                        <TableCell className="text-xs text-slate-400">{wf.enabled ? (wf.lastRun && wf.scheduleIntervalMs ? `Next: ${formatDistanceToNow(wf.lastRun + wf.scheduleIntervalMs, { addSuffix: true })}` : 'Active') : 'Disabled'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-amber-500 transition-colors">
              <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-slate-400">Drag & drop n8n JSON file here</p>
              <p className="text-xs text-slate-600">or</p>
              <Button variant="link" className="text-amber-400 p-0 h-auto" onClick={() => document.getElementById('file-upload')?.click()}>
                browse files
              </Button>
              <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full bg-slate-900/50 border-slate-700/50 backdrop-blur-sm relative">
              <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
                <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#1e293b" />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
              </ReactFlow>
              {selectedWorkflow && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                  <Button onClick={() => runMutation.mutate(selectedWorkflow.id)} disabled={runMutation.isPending}>
                    {runMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Run Now
                  </Button>
                  <Card className="p-4 bg-slate-900/70 border-slate-700/50 backdrop-blur-md w-80">
                    <CardTitle className="text-base text-amber-300 mb-3">Schedule Automation</CardTitle>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Preset Interval</Label>
                        <Select onValueChange={handlePresetChange} defaultValue={SCHEDULE_PRESETS.find(p => p.minutes === 60)?.value || '60'}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                            {SCHEDULE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-minutes" className="text-slate-300">Custom Interval (minutes)</Label>
                        <Input id="custom-minutes" type="number" value={localMinutes} onChange={e => setLocalMinutes(Number(e.target.value))} className="bg-slate-800/50 border-slate-700" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enabled-switch" className="text-slate-300">Enable Schedule</Label>
                        <Switch id="enabled-switch" checked={localEnabled} onCheckedChange={setLocalEnabled} />
                      </div>
                      <p className="text-xs text-slate-500">Next run approx: {localEnabled ? formatDistanceToNow(Date.now() + localMinutes * 60000, { addSuffix: true }) : 'disabled'}</p>
                      <Button onClick={handleSaveSchedule} disabled={saveScheduleMutation.isPending} className="w-full">
                        {saveScheduleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Schedule
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <footer className="absolute bottom-2 right-4 text-xs text-slate-600 z-10">
        Built with ��️ at Cloudflare
      </footer>
    </div>
  );
}