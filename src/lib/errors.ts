import { HttpError, Issue } from '@karasu-lab/types/server';

export class MissingEnvironmentVariableError extends HttpError {
  constructor(variableName: string) {
    super(500, { error: 'missing_environment_variable', detail: variableName });
    this.name = 'MissingEnvironmentVariableError';
  }
}

export class UpstreamRequestFailedError extends HttpError {
  constructor(detail: string) {
    super(502, { error: 'upstream_request_failed', detail });
    this.name = 'UpstreamRequestFailedError';
  }
}

export class TemplateReadFailedError extends HttpError {
  constructor(detail: string) {
    super(502, { error: 'template_read_failed', detail });
    this.name = 'TemplateReadFailedError';
  }
}

export class RepositoryHeadUnresolvedError extends HttpError {
  constructor(detail: string) {
    super(502, { error: 'repository_head_unresolved', detail });
    this.name = 'RepositoryHeadUnresolvedError';
  }
}

export class InvalidRepositoryFullNameError extends HttpError {
  constructor(issues: Issue[]) {
    super(400, { error: 'invalid_repository_full_name' }, undefined, issues);
    this.name = 'InvalidRepositoryFullNameError';
  }
}

export class InvalidRepositoryNameError extends HttpError {
  constructor(issues: Issue[]) {
    super(400, { error: 'invalid_repository_name' }, undefined, issues);
    this.name = 'InvalidRepositoryNameError';
  }
}

export class InvalidIdentifierError extends HttpError {
  constructor(issues: Issue[]) {
    super(400, { error: 'invalid_identifier' }, undefined, issues);
    this.name = 'InvalidIdentifierError';
  }
}

export class InvalidBranchNameError extends HttpError {
  constructor(issues: Issue[]) {
    super(400, { error: 'invalid_branch_name' }, undefined, issues);
    this.name = 'InvalidBranchNameError';
  }
}

export class PrivateRepositoryNotAllowedError extends HttpError {
  constructor(repositoryFullName: string) {
    super(400, { error: 'private_repository_not_allowed', detail: repositoryFullName });
    this.name = 'PrivateRepositoryNotAllowedError';
  }
}

export class SetupRepositoryCannotBeLinkedError extends HttpError {
  constructor() {
    super(400, { error: 'setup_repository_cannot_be_linked' });
    this.name = 'SetupRepositoryCannotBeLinkedError';
  }
}

export class TenantSetupRoleRequiredError extends HttpError {
  constructor() {
    super(403, { error: 'tenant_setup_role_required' });
    this.name = 'TenantSetupRoleRequiredError';
  }
}

export class NpmNotConfiguredError extends HttpError {
  constructor() {
    super(409, { error: 'npm_not_configured' });
    this.name = 'NpmNotConfiguredError';
  }
}

export class GithubAppNotInstalledError extends HttpError {
  constructor() {
    super(409, { error: 'github_app_not_installed' });
    this.name = 'GithubAppNotInstalledError';
  }
}

export class RepositoryNotInInstallationError extends HttpError {
  constructor() {
    super(404, { error: 'repository_not_in_installation' });
    this.name = 'RepositoryNotInInstallationError';
  }
}

export class PackageJsonNotFoundError extends HttpError {
  constructor() {
    super(404, { error: 'package_json_not_found' });
    this.name = 'PackageJsonNotFoundError';
  }
}

export class LinkedPackageNotFoundError extends HttpError {
  constructor() {
    super(404, { error: 'linked_package_not_found' });
    this.name = 'LinkedPackageNotFoundError';
  }
}
