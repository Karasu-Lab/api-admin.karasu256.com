import { env } from 'cloudflare:workers';
import { z } from 'zod';

const clientConfigSchema = z.object({
  authApiUrl: z.string().url(),
  appUrl: z.string().url(),
  gitApiUrl: z.string().url(),
});

export type ClientConfig = z.infer<typeof clientConfigSchema>;

export function getClientConfig(): ClientConfig {
  return clientConfigSchema.parse({
    authApiUrl: env.AUTH_API_URL,
    appUrl: env.APP_URL,
    gitApiUrl: env.GIT_API_URL,
  });
}
