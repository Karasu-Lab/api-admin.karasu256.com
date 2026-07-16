import { Provider } from '@nestjs/common';
import Docker from 'dockerode';
import { AppConfigService } from '../config/config.service.js';

export const DOCKER_CLIENT = 'DOCKER_CLIENT';

export const dockerProvider: Provider = {
  provide: DOCKER_CLIENT,
  useFactory: (config: AppConfigService) =>
    new Docker({ socketPath: config.dockerSocketPath }),
  inject: [AppConfigService],
};
