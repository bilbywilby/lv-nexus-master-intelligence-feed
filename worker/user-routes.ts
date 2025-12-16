import { Hono } from "hono";
import type { Env } from './core-utils';
import { FeedEntity, FeedConfig } from "./feed-entities";
import { ok, bad, isStr } from './core-utils';
import { WorkflowEntity } from "./automation-entities";
import type { N8nWorkflow } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // LV-NEXUS FEED API
  app.get('/api/feed/live', async (c) => {
    const feed = new FeedEntity(c.env);
    const data = await feed.getLatest();
    return ok(c, data);
  });
  app.post('/api/feed/reset', async (c) => {
    const feed = new FeedEntity(c.env);
    const data = await feed.resetFeed();
    return ok(c, data);
  });
  app.get('/api/feed/config', async (c) => {
    const feed = new FeedEntity(c.env);
    const config = await feed.getConfig();
    return ok(c, config);
  });
  app.post('/api/feed/config', async (c) => {
    try {
      const { frequency, chaos } = await c.req.json<FeedConfig>();
      if (typeof frequency !== 'number' || typeof chaos !== 'boolean') {
        return bad(c, 'Invalid config payload');
      }
      const feed = new FeedEntity(c.env);
      await feed.updateConfig({ frequency, chaos });
      return ok(c, { success: true });
    } catch (e) {
      return bad(c, 'Failed to parse request body');
    }
  });
  // AUTOMATION INTEL API
  app.post('/api/automation/workflows', async (c) => {
    try {
      const json = await c.req.json<N8nWorkflow>();
      if (!json.nodes || !json.connections) {
        return bad(c, 'Invalid workflow JSON');
      }
      const workflow = new WorkflowEntity(c.env, crypto.randomUUID());
      const id = await workflow.importWorkflow(json);
      return ok(c, { id });
    } catch (e) {
      return bad(c, 'Failed to parse request body');
    }
  });
  app.get('/api/automation/workflows', async (c) => {
    const { cursor, limit } = c.req.query();
    const res = await WorkflowEntity.list(c.env, cursor || null, Number(limit) || 10);
    return ok(c, res);
  });
  app.post('/api/automation/run/:id', async (c) => {
    const id = c.req.param('id');
    if (!isStr(id)) {
      return bad(c, 'Invalid Workflow ID');
    }
    const workflow = new WorkflowEntity(c.env, id);
    const res = await workflow.dryRun();
    return ok(c, res);
  });
  app.post('/api/automation/workflows/:id/schedule', async (c) => {
    const id = c.req.param('id');
    if (!isStr(id)) {
      return bad(c, 'Invalid ID');
    }
    try {
      const { scheduleIntervalMs, enabled } = await c.req.json<{ scheduleIntervalMs: number; enabled: boolean }>();
      if (typeof scheduleIntervalMs !== 'number' || scheduleIntervalMs <= 0 || typeof enabled !== 'boolean') {
        return bad(c, 'Invalid schedule payload');
      }
      const workflow = new WorkflowEntity(c.env, id);
      await workflow.updateSchedule({ scheduleIntervalMs, enabled });
      return ok(c, { success: true });
    } catch (e) {
      return bad(c, 'Failed to parse request body');
    }
  });
}