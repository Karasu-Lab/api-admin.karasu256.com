import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { HttpError } from '@karasu-lab/types/server';
import { log } from '@karasu-lab/utils/server/log';
import { uninstallTenantBot, getGithubAppInstallUrl, setTenantPackageEnabled } from './lib/api-auth';
import { handlePreflight, withCors } from './lib/cors';
import { DashboardQueries } from './lib/dashboard-data';
import { GithubWebhookHandler } from './lib/github-webhook-handler';
import { LiveFeedStream } from './lib/live-feed-stream';
import { PackageLinking } from './lib/package-linking';
import { PointerResultsHandler } from './lib/pointer-results';
import { RepositorySetup } from './lib/repository-setup';
import {
  linkPackageBodySchema,
  npmRepositorySetupBodySchema,
  packageEnabledBodySchema,
  templateRepositorySetupBodySchema,
  tenantQuerySchema,
} from './lib/request-schemas';
import { markTenantSetupCompleted } from './lib/setup-completion';
import { TenantAccess } from './lib/tenant-access';
import { WebhookSecrets } from './lib/webhook-secret';

const app = new Elysia({ adapter: CloudflareAdapter, aot: false, normalize: 'typebox' })
  .onError(({ code, error, request }) => {
    if (error instanceof HttpError) {
      return Response.json(error.issues.length > 0 ? { ...error.body, issues: error.issues } : error.body, {
        status: error.status,
        headers: error.headers,
      });
    }
    if (code === 'VALIDATION' || code === 'PARSE') return Response.json({ error: 'Bad Request' }, { status: 400 });
    if (code === 'NOT_FOUND') return Response.json({ error: 'Not Found' }, { status: 404 });
    log(
      'request_error',
      {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        method: request.method,
        path: new URL(request.url).pathname,
      },
      'error'
    );
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  })
  .get('/api/dashboard', ({ request, query }) => new DashboardQueries(request).dashboard(query.tenant), {
    query: tenantQuerySchema(),
  })
  .get('/api/setup', ({ request, query }) => new DashboardQueries(request).setup(query.tenant), {
    query: tenantQuerySchema(),
  })
  .get('/api/packages', ({ request, query }) => new DashboardQueries(request).packages(query.tenant), {
    query: tenantQuerySchema(),
  })
  .get('/api/tenants/:id/settings', ({ request, params }) => new DashboardQueries(request).tenantSettings(params.id))
  .get('/api/tenants/:id/profile', ({ request, params }) => new DashboardQueries(request).profile(params.id))
  .get('/api/tenants/:id/live-feed', ({ request, params }) => new DashboardQueries(request).liveFeed(params.id))
  .get('/api/live', ({ request }) => new LiveFeedStream(request).respond(request))
  .get('/api/github-app/install-url', async ({ request }) => {
    await new TenantAccess(request).requireUserId();
    return { installUrl: await getGithubAppInstallUrl() };
  })
  .post(
    '/api/tenants/:id/npm-repository/setup',
    ({ request, params, body }) => new RepositorySetup(request).startNpm(params.id, body.npmRepositoryName),
    { body: npmRepositorySetupBodySchema() }
  )
  .post(
    '/api/tenants/:id/template-repository/setup',
    ({ request, params, body }) => new RepositorySetup(request).startTemplate(params.id, body.templateRepositoryName),
    { body: templateRepositorySetupBodySchema() }
  )
  .post('/api/tenants/:id/packages', ({ request, params, body }) => new PackageLinking(request).link(params.id, body.repositoryId), {
    body: linkPackageBodySchema(),
  })
  .post('/api/tenants/:id/setup-completion', async ({ request, params }) => {
    await new TenantAccess(request).requireSetupRole(params.id);
    await markTenantSetupCompleted(params.id);
    return { ok: true };
  })
  .post('/api/tenants/:id/webhook-secret', async ({ request, params }) => {
    await new TenantAccess(request).requireSetupRole(params.id);
    const secrets = new WebhookSecrets();
    const secret = secrets.generate();
    await secrets.set(params.id, secret);
    return { secret };
  })
  .put(
    '/api/tenants/:id/packages/:packageId/enabled',
    async ({ request, params, body }) => {
      const { userId } = await new TenantAccess(request).requireSetupRole(params.id);
      await setTenantPackageEnabled(params.id, params.packageId, { userId, enabled: body.enabled });
      return { ok: true };
    },
    { body: packageEnabledBodySchema() }
  )
  .delete('/api/tenants/:id/github-installation', async ({ request, params }) => {
    const { userId } = await new TenantAccess(request).requireSetupRole(params.id);
    await uninstallTenantBot(params.id, { userId });
    return { ok: true };
  })
  .delete('/api/tenants/:id/npm-repository', async ({ request, params }) => {
    await new RepositorySetup(request).unlinkNpm(params.id);
    return { ok: true };
  })
  .delete('/api/tenants/:id/packages/:packageId', async ({ request, params }) => {
    await new PackageLinking(request).unlink(params.id, params.packageId);
    return { ok: true };
  })
  .post('/api/github/webhook', ({ request }) => new GithubWebhookHandler().handle(request), { parse: 'none' })
  .post('/api/internal/pointer-results', ({ request }) => new PointerResultsHandler().handle(request), { parse: 'none' });

export default {
  fetch: async (request: Request): Promise<Response> => {
    const preflight = handlePreflight(request);
    if (preflight) return preflight;
    return withCors(request, await app.fetch(request));
  },
};
