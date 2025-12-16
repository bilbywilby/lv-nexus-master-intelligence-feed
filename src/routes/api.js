import { feedEntity, workflowEntity, simAllCrons } from '../lib/entities/inmem.js';
const ok = (reply, data) => reply.send({ success: true, data });
const bad = (reply, error, code = 400) => reply.code(code).send({ success: false, error });
export default async function apiRoutes(fastify, options) {
  // LV-NEXUS FEED API
  fastify.get('/api/feed/live', async (request, reply) => {
    const data = await feedEntity.getLatest();
    return ok(reply, data);
  });
  fastify.post('/api/feed/reset', async (request, reply) => {
    const data = await feedEntity.resetFeed();
    return ok(reply, data);
  });
  fastify.get('/api/feed/config', async (request, reply) => {
    return ok(reply, feedEntity.state.config);
  });
  fastify.post('/api/feed/config', async (request, reply) => {
    const { frequency, chaos } = request.body;
    if (typeof frequency !== 'number' || typeof chaos !== 'boolean') {
      return bad(reply, 'Invalid config payload');
    }
    const newConfig = await feedEntity.updateConfig({ frequency, chaos });
    return ok(reply, newConfig);
  });
  // AUTOMATION INTEL API
  fastify.post('/api/automation/workflows', async (request, reply) => {
    const workflowData = request.body;
    if (!workflowData.nodes || !workflowData.connections) {
      return bad(reply, 'Invalid workflow JSON');
    }
    const newWorkflow = await workflowEntity.create(workflowData);
    return ok(reply, { id: newWorkflow.id });
  });
  fastify.get('/api/automation/workflows', async (request, reply) => {
    await simAllCrons();
    const workflows = await workflowEntity.list();
    return ok(reply, workflows);
  });
  fastify.post('/api/automation/run/:id', async (request, reply) => {
    const { id } = request.params;
    const res = await workflowEntity.dryRun(id);
    return ok(reply, res);
  });
  fastify.post('/api/automation/workflows/:id/schedule', async (request, reply) => {
    const { id } = request.params;
    const { scheduleIntervalMs, enabled } = request.body;
    if (typeof scheduleIntervalMs !== 'number' || scheduleIntervalMs < 0 || typeof enabled !== 'boolean') {
      return bad(reply, 'Invalid schedule payload');
    }
    await workflowEntity.updateSchedule(id, { scheduleIntervalMs, enabled });
    return ok(reply, { success: true });
  });
  fastify.post('/api/automation/summarize/:url', async (request, reply) => {
    const { url } = request.params;
    if (typeof url !== 'string' || !url.endsWith('.pdf')) {
      return bad(reply, 'Invalid PDF URL');
    }
    const mockSummaries = [
      'AI Brief: Critical traffic outage on Hamilton St impacting ops.',
      'AI Brief: Infrastructure alert - power flicker in Bethlehem core.',
      'AI Brief: Medical dispatch to 3rd St, Easton - ambulance en route.'
    ];
    const summary = mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
    return ok(reply, { summary, actions: ['preview', 'download'] });
  });
}