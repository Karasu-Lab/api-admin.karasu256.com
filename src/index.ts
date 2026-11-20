import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';

const app = new Elysia({ adapter: CloudflareAdapter, aot: false, normalize: 'typebox' });

export default {
  fetch: (request: Request) => app.fetch(request),
};
