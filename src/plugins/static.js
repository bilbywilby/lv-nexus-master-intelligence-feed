import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function staticPlugin(fastify, opts) {
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', '..', 'public'),
    prefix: '/',
  });
  // Fallback for single-page applications
  fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url && !request.raw.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    reply.code(404).send({ success: false, error: 'Not Found' });
  });
}
export default fp(staticPlugin);