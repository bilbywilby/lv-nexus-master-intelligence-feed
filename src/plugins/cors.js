import fp from 'fastify-plugin';
import cors from '@fastify/cors';
async function corsPlugin(fastify, opts) {
  fastify.register(cors, {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
}
export default fp(corsPlugin);