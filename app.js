import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import autoload from '@fastify/autoload';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fastify = Fastify({
  logger: true,
});
// Register plugins
fastify.register(autoload, {
  dir: path.join(__dirname, 'src/plugins'),
});
// Register routes
fastify.register(autoload, {
  dir: path.join(__dirname, 'src/routes'),
  options: { prefix: '/' },
});
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();