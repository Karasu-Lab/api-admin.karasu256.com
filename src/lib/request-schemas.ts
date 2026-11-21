import { z } from 'zod';

export function tenantQuerySchema() {
  return z.object({ tenant: z.string().optional() });
}

export function npmRepositorySetupBodySchema() {
  return z.object({ npmRepositoryName: z.string() });
}

export function templateRepositorySetupBodySchema() {
  return z.object({ templateRepositoryName: z.string() });
}

export function linkPackageBodySchema() {
  return z.object({ repositoryId: z.number() });
}

export function packageEnabledBodySchema() {
  return z.object({ enabled: z.boolean() });
}
