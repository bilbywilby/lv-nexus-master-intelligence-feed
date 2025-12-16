import { IndexedEntity } from "./core-utils";
import type { N8nWorkflow, WorkflowEntityState, FeedItem, AutomationRunResponse } from "@shared/types";
import { FeedEntity } from "./feed-entities";
import { generateMockFeedItem } from "../src/lib/mock-data-generator";
import type { Env } from './core-utils';
function parseMockSitemap(xml: string) {
  const locRegex = /<loc>(.*?)<\/loc>/gi;
  const urls: Array<{ loc: [string] }> = [];
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push({ loc: [match[1]] });
  }
  return { urlset: { url: urls } };
}
export class WorkflowEntity extends IndexedEntity<WorkflowEntityState> {
  static readonly entityName = "workflow";
  static readonly indexName = "workflows";
  static readonly initialState: WorkflowEntityState = {
    id: "",
    workflow: { nodes: [], connections: {} },
    createdAt: 0,
    scheduleIntervalMs: 3600000, // 1 hour default
    enabled: false,
    lastRun: 0,
  };
  static async list(env: Env, cursor?: string | null, limit?: number): Promise<{ items: WorkflowEntityState[]; next: string | null; }> {
    const result = await super.list(env, cursor, limit);
    // Simulate cron for each workflow when listed
    for (const row of result.items) {
      const workflowInstance = new this(env, row.id);
      await workflowInstance.simCron();
    }
    // Re-fetch the list to get updated lastRun times
    const updatedResult = await super.list(env, cursor, limit);
    return updatedResult;
  }
  async importWorkflow(workflow: N8nWorkflow): Promise<string> {
    const id = crypto.randomUUID();
    const state: WorkflowEntityState = {
      ...WorkflowEntity.initialState,
      id,
      workflow,
      createdAt: Date.now(),
    };
    await WorkflowEntity.create(this.env, state);
    return id;
  }
  async updateSchedule(updates: { scheduleIntervalMs: number; enabled: boolean; }): Promise<void> {
    return this.patch(updates);
  }
  async simCron(): Promise<boolean> {
    const state = await this.getState();
    if (!state.enabled || !state.scheduleIntervalMs) {
      return false;
    }
    const now = Date.now();
    const jitter = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const effectiveInterval = state.scheduleIntervalMs * jitter;
    if (now - (state.lastRun || 0) > effectiveInterval) {
      await this.dryRun(true);
      await this.patch({ lastRun: now });
      return true;
    }
    return false;
  }
  async dryRun(scheduled = false): Promise<AutomationRunResponse> {
    const state = await this.getState();
    if (!state.workflow) {
      throw new Error("Workflow not found");
    }
    const { nodes, connections } = state.workflow;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    let results: FeedItem[] = [];
    try {
      const startNode = nodes.find(n => n.type === 'n8n-nodes-base.start');
      if (!startNode) throw new Error("Start node not found");
      const httpNodeId = connections[startNode.id]?.main[0][0]?.node;
      const httpNode = nodeMap.get(httpNodeId);
      if (!httpNode || httpNode.type !== 'n8n-nodes-base.httpRequest') throw new Error("HTTP Request node not found after start");
      const mockSitemapXml = `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
          <url><loc>https://example.com/docs/whitepaper.pdf</loc></url>
          <url><loc>https://example.com/page2</loc></url>
          <url><loc>https://example.com/assets/brochure.pdf</loc></url>
        </urlset>`;
      const xmlNodeId = connections[httpNode.id]?.main[0][0]?.node;
      const xmlNode = nodeMap.get(xmlNodeId);
      if (!xmlNode || xmlNode.type !== 'n8n-nodes-base.xml') throw new Error("XML node not found after HTTP Request");
      const parsedXml = parseMockSitemap(mockSitemapXml);
      const urls = parsedXml.urlset.url.map((u: any) => u.loc[0]);
      const filterNodeId = connections[xmlNode.id]?.main[0][0]?.node;
      const filterNode = nodeMap.get(filterNodeId);
      if (!filterNode || filterNode.type !== 'n8n-nodes-base.filter') throw new Error("Filter node not found after XML");
      const pdfUrls = urls.filter((url: string) => url.endsWith('.pdf'));
      for (const url of pdfUrls) {
        const mockItem = generateMockFeedItem();
        const feedItem: FeedItem = {
          ...mockItem,
          id: crypto.randomUUID(),
          type: 'AUTOMATION',
          severity: 'High',
          title: `${scheduled ? 'SCHEDULED: ' : ''}Automation: New PDF Found`,
          location: url,
          timestamp: Date.now(),
        };
        results.push(feedItem);
      }
      if (results.length > 0) {
        const feed = new FeedEntity(this.env);
        await feed.addAutomationEvents(results);
      }
      return {
        results,
        summary: `Dry run complete. Found ${results.length} matching items.`,
      };
    } catch (error) {
      console.error("Workflow simulation error:", error);
      const message = error instanceof Error ? error.message : "Unknown simulation error";
      return {
        results: [],
        summary: `Dry run failed: ${message}`,
      };
    }
  }
}