import { z } from 'zod';
import { ADMIN_TENANT_TYPE } from '@karasu-lab/types/shared';
import { UnauthorizedError } from '@karasu-lab/types/server';
import { assignTenantType, getTenantOverview } from './api-auth';
import { getClientConfig } from './client-config';
import { TenantSetupRoleRequiredError } from './errors';
import { getSessionUser } from './session';
import { tenantOverviewSchema } from './tenants';

export function tenantRoleSchema() {
  return z.enum(['owner', 'admin', 'member']);
}

export type TenantRole = z.infer<ReturnType<typeof tenantRoleSchema>>;

export function tenantAccessResultSchema() {
  return z.object({ userId: z.string(), overview: tenantOverviewSchema() });
}

export type TenantAccessResult = z.infer<ReturnType<typeof tenantAccessResultSchema>>;

export class TenantAccess {
  setupRoles: TenantRole[] = [tenantRoleSchema().enum.owner, tenantRoleSchema().enum.admin];

  constructor(readonly request: Request) {}

  async requireUserId(): Promise<string> {
    const user = await getSessionUser(getClientConfig().authApiUrl, this.request);
    if (!user) throw new UnauthorizedError();
    return user.uid;
  }

  async optionalUserId(): Promise<string | null> {
    const user = await getSessionUser(getClientConfig().authApiUrl, this.request);
    return user ? user.uid : null;
  }

  hasSetupRole(role: string): boolean {
    return this.setupRoles.some((setupRole) => setupRole === role);
  }

  async requireMember(organizationId: string): Promise<TenantAccessResult> {
    const userId = await this.requireUserId();
    const overview = await getTenantOverview(organizationId, userId);
    await assignTenantType(organizationId, { userId, type: ADMIN_TENANT_TYPE });
    return { userId, overview };
  }

  async requireSetupRole(organizationId: string): Promise<TenantAccessResult> {
    const access = await this.requireMember(organizationId);
    if (!this.hasSetupRole(access.overview.organization.role)) throw new TenantSetupRoleRequiredError();
    return access;
  }
}
