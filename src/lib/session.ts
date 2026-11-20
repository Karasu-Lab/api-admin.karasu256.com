import { z } from 'zod';
import { log } from '@karasu-lab/utils/server/log';

export function sessionUserSchema() {
  return z.object({
    uid: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  });
}

export type SessionUser = z.infer<ReturnType<typeof sessionUserSchema>>;

export function getSessionResponseSchema() {
  return z.object({
    user: z
      .object({
        id: z.string(),
        email: z.string().nullish(),
        name: z.string().nullish(),
        image: z.string().nullish(),
      })
      .nullish(),
  });
}

export type GetSessionResponse = z.infer<ReturnType<typeof getSessionResponseSchema>>;

export async function getSessionUser(authApiUrl: string | undefined, request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get('cookie');
  if (!authApiUrl || !cookie) return null;

  const url = `${authApiUrl}/api/auth/get-session`;
  try {
    const res = await fetch(url, { headers: { cookie }, cache: 'no-store' });
    if (!res.ok) {
      log('get_session_user', { result: 'failure', url, status: res.status }, 'error');
      return null;
    }
    const data = getSessionResponseSchema().parse(await res.json());
    if (!data.user) {
      log('get_session_user', { result: 'no_session' }, 'error');
      return null;
    }
    return {
      uid: data.user.id,
      email: data.user.email ?? null,
      name: data.user.name ?? null,
      image: data.user.image ?? null,
    };
  } catch (err) {
    log('get_session_user', { result: 'error', url, error: err instanceof Error ? err.message : String(err) }, 'error');
    return null;
  }
}
