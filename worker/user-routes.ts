import { Hono } from "hono";
import type { Env } from './core-utils';
import { FeedEntity, FeedConfig } from "./feed-entities";
import { ok, bad } from './core-utils';
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
}