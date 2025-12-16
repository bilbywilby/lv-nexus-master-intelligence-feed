import { IndexedEntity } from "./core-utils";
import type { N8nWorkflow, WorkflowEntityState, FeedItem, AutomationRunResponse } from "@shared/types";
import { parseStringPromise } from 'xml2js';
import { FeedEntity } from "./feed-entities";
import { generateMockFeedItem } from "../src/lib/mock-data-generator";
export class WorkflowEntity extends IndexedEntity<WorkflowEntityState> {
  static readonly entityName = "workflow";
  static readonly indexName = "workflows";
  static readonly initialState: WorkflowEntityState = {
    id: "",
    workflow: { nodes: [], connections: {} },
    createdAt: 0,
  };
  async importWorkflow(workflow: N8nWorkflow): Promise<string> {
    const id = crypto.randomUUID();
    const state: WorkflowEntityState = {
      id,
      workflow,
      createdAt: Date.now(),
    };
    await WorkflowEntity.create(this.env, state);
    return id;
  }
  async dryRun(id: string): Promise<AutomationRunResponse> {
    const state = await new WorkflowEntity(this.env, id).getState();
    if (!state.workflow) {
      throw new Error("Workflow not found");
    }
    const { nodes, connections } = state.workflow;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    let results: FeedItem[] = [];
    // Simplified linear execution simulation
    try {
      // 1. Find Start Node
      const startNode = nodes.find(n => n.type === 'n8n-nodes-base.start');
      if (!startNode) throw new Error("Start node not found");
      // 2. Simulate HTTP Request for sitemap
      const httpNodeId = connections[startNode.id]?.main[0][0]?.node;
      const httpNode = nodeMap.get(httpNodeId);
      if (!httpNode || httpNode.type !== 'n8n-nodes-base.httpRequest') throw new Error("HTTP Request node not found after start");
      // Mock sitemap fetch
      const mockSitemapXml = `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
          <url><loc>https://example.com/docs/whitepaper.pdf</loc></url>
          <url><loc>https://example.com/page2</loc></url>
          <url><loc>https://example.com/assets/brochure.pdf</loc></url>
        </urlset>`;
      // 3. Simulate XML parsing
      const xmlNodeId = connections[httpNode.id]?.main[0][0]?.node;
      const xmlNode = nodeMap.get(xmlNodeId);
      if (!xmlNode || xmlNode.type !== 'n8n-nodes-base.xml') throw new Error("XML node not found after HTTP Request");
      const parsedXml = await parseStringPromise(mockSitemapXml);
      const urls = parsedXml.urlset.url.map((u: any) => u.loc[0]);
      // 4. Simulate Filter
      const filterNodeId = connections[xmlNode.id]?.main[0][0]?.node;
      const filterNode = nodeMap.get(filterNodeId);
      if (!filterNode || filterNode.type !== 'n8n-nodes-base.filter') throw new Error("Filter node not found after XML");
      const pdfUrls = urls.filter((url: string) => url.endsWith('.pdf'));
      // 5. Generate FeedItems
      for (const url of pdfUrls) {
        const mockItem = generateMockFeedItem();
        const feedItem: FeedItem = {
          ...mockItem,
          id: crypto.randomUUID(),
          type: 'AUTOMATION',
          severity: 'High',
          title: `Automation: New PDF Found`,
          location: url,
          timestamp: Date.now(),
        };
        results.push(feedItem);
      }
      // 6. Push to live feed
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