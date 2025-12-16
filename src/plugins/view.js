import fp from 'fastify-plugin';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function viewPlugin(fastify, opts) {
  fastify.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
    root: path.join(__dirname, '..', '..', 'views'),
  });
}
export default fp(viewPlugin);