import { feedEntity } from '../lib/entities/inmem.js';
export default async function uiRoutes(fastify, options) {
  fastify.get('/dashboard-ssr', async (request, reply) => {
    const feedState = await feedEntity.getLatest();
    return reply.view('dashboard.ejs', {
      items: feedState.items,
      stats: feedState.stats,
    });
  });
}