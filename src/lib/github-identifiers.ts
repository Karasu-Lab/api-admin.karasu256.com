import { z } from 'zod';
import { Issue } from '@karasu-lab/types/server';
import { InvalidBranchNameError, InvalidIdentifierError, InvalidRepositoryFullNameError, InvalidRepositoryNameError } from './errors';

export class GithubIdentifiers {
  repositoryFullNamePattern = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
  commitShaPattern = /^[0-9a-f]{40}$/;
  submodulePathPattern = /^packages\/[A-Za-z0-9._-]+$/;
  opaqueIdPattern = /^[A-Za-z0-9_-]{1,128}$/;
  repositoryNamePattern = /^[A-Za-z0-9._-]{1,100}$/;
  branchNamePattern = /^[A-Za-z0-9._/-]+$/;
  maxBranchNameLength = 200;
  dotSegments = ['.', '..'];
  forbiddenBranchFragments = ['..', '//'];
  forbiddenBranchPrefixes = ['-', '/'];
  forbiddenBranchSuffixes = ['/', '.lock'];

  repositoryFullNameSchema() {
    return z
      .string()
      .regex(this.repositoryFullNamePattern)
      .refine((value) => value.split('/').every((segment) => !this.dotSegments.includes(segment)));
  }

  repositoryNameSchema() {
    return z
      .string()
      .regex(this.repositoryNamePattern)
      .refine((value) => !this.dotSegments.includes(value));
  }

  commitShaSchema() {
    return z.string().regex(this.commitShaPattern);
  }

  submodulePathSchema() {
    return z
      .string()
      .regex(this.submodulePathPattern)
      .refine((value) => !this.dotSegments.includes(value.split('/')[1]));
  }

  opaqueIdSchema() {
    return z.string().regex(this.opaqueIdPattern);
  }

  branchNameSchema() {
    return z
      .string()
      .min(1)
      .max(this.maxBranchNameLength)
      .regex(this.branchNamePattern)
      .refine((value) => !this.forbiddenBranchFragments.some((fragment) => value.includes(fragment)))
      .refine((value) => !this.forbiddenBranchPrefixes.some((prefix) => value.startsWith(prefix)))
      .refine((value) => !this.forbiddenBranchSuffixes.some((suffix) => value.endsWith(suffix)));
  }

  isRepositoryFullName(value: unknown): value is string {
    return this.repositoryFullNameSchema().safeParse(value).success;
  }

  isRepositoryName(value: unknown): value is string {
    return this.repositoryNameSchema().safeParse(value).success;
  }

  isCommitSha(value: unknown): value is string {
    return this.commitShaSchema().safeParse(value).success;
  }

  isSubmodulePath(value: unknown): value is string {
    return this.submodulePathSchema().safeParse(value).success;
  }

  isOpaqueId(value: unknown): value is string {
    return this.opaqueIdSchema().safeParse(value).success;
  }

  isBranchName(value: unknown): value is string {
    return this.branchNameSchema().safeParse(value).success;
  }

  assertRepositoryFullName(value: string): string {
    const parsed = this.repositoryFullNameSchema().safeParse(value);
    if (!parsed.success) throw new InvalidRepositoryFullNameError(Issue.fromZodError(parsed.error));
    return parsed.data;
  }

  assertRepositoryName(value: string): string {
    const parsed = this.repositoryNameSchema().safeParse(value);
    if (!parsed.success) throw new InvalidRepositoryNameError(Issue.fromZodError(parsed.error));
    return parsed.data;
  }

  assertOpaqueId(value: string): string {
    const parsed = this.opaqueIdSchema().safeParse(value);
    if (!parsed.success) throw new InvalidIdentifierError(Issue.fromZodError(parsed.error));
    return parsed.data;
  }

  assertBranchName(value: string): string {
    const parsed = this.branchNameSchema().safeParse(value);
    if (!parsed.success) throw new InvalidBranchNameError(Issue.fromZodError(parsed.error));
    return parsed.data;
  }

  encodeRepositoryPath(repositoryFullName: string): string {
    return this.assertRepositoryFullName(repositoryFullName).split('/').map(encodeURIComponent).join('/');
  }
}
