import { getSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';
import { sessionUserSchema, type SessionUser } from '@karasu-lab/types/shared';
import { log } from '@karasu-lab/utils/server/log';

export type { SessionUser };

export function getSessionResponseSchema() {
  return z.object({
    user: sessionUserSchema
      .extend({
        email: z.string().nullish(),
        name: z.string().nullish(),
        image: z.string().nullish(),
      })
      .nullish(),
  });
}

export type GetSessionResponse = z.infer<ReturnType<typeof getSessionResponseSchema>>;

export async function getSessionUser(authApiUrl: string | undefined, request: Request): Promise<SessionUser | null> {
  if (!authApiUrl || !getSessionCookie(request.headers)) return null;

  const url = `${authApiUrl}/api/auth/get-session`;
  try {
    const res = await fetch(url, { headers: { cookie: request.headers.get('cookie') ?? '' }, cache: 'no-store' });
    if (!res.ok) {
      log('get_session_user', { result: 'failure', url, status: res.status }, 'error');
      return null;
    }
    const parsed = getSessionResponseSchema().safeParse(await res.json().catch(() => null));
    if (!parsed.success || !parsed.data.user) {
      log('get_session_user', { result: 'no_session' }, 'error');
      return null;
    }
    const { user } = parsed.data;
    return { id: user.id, email: user.email ?? null, name: user.name ?? null, image: user.image ?? null };
  } catch (err) {
    log('get_session_user', { result: 'error', url, error: err instanceof Error ? err.message : String(err) }, 'error');
    return null;
  }
}
