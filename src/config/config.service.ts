import { Injectable, Inject } from '@nestjs/common';
import { platform } from 'os';
import { APP_CONFIG_TOKEN } from './config.constants.js';
import type { AppConfig } from './config.schema.js';

@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig) {}

  /** Returns the Docker socket path appropriate for the current OS. */
  get dockerSocketPath(): string {
    return platform() === 'win32'
      ? this.config.docker.socket.win32
      : this.config.docker.socket.default;
  }

  get port(): number {
    return this.config.server.port;
  }

  get corsOrigin(): string {
    return this.config.server.corsOrigin;
  }

  get cloudflare() {
    return this.config.cloudflare;
  }
}
