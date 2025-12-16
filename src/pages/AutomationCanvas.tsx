import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Node, Edge, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NavHeader } from '@/components/NavHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadCloud, Play, FileJson, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { N8nWorkflow, WorkflowEntityState, AutomationRunResponse } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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
export function AutomationCanvas() {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowEntityState | null>(null);
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<{ items: WorkflowEntityState[] }>({
    queryKey: ['workflows'],
    queryFn: () => api('/api/automation/workflows'),
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
  useEffect(() => {
    if (!workflows && !isLoadingWorkflows) {
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
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWorkflows && <TableRow><TableCell colSpan={2}><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>}
                    {workflows?.items.map(wf => (
                      <TableRow key={wf.id} onClick={() => loadWorkflow(wf)} className={cn("cursor-pointer hover:bg-slate-800/50", selectedWorkflow?.id === wf.id && "bg-slate-800/70")}>
                        <TableCell className="font-medium text-slate-200">{wf.workflow.name || 'Untitled Workflow'}</TableCell>
                        <TableCell className="text-xs text-slate-400">{formatDistanceToNow(new Date(wf.createdAt), { addSuffix: true })}</TableCell>
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
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#1e293b" />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
              </ReactFlow>
              {selectedWorkflow && (
                <div className="absolute top-4 right-4 z-10">
                  <Button onClick={() => runMutation.mutate(selectedWorkflow.id)} disabled={runMutation.isPending}>
                    {runMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Dry Run
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <footer className="absolute bottom-2 right-4 text-xs text-slate-600 z-10">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}