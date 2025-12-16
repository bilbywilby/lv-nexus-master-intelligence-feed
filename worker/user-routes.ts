import { Hono } from "hono";
import type { Env } from './core-utils';
import { FeedEntity } from "./feed-entities";
import { ok } from './core-utils';
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
  // --- Original Demo Routes (can be removed or kept for reference) ---
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
}