import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { CloudflareAccessModule } from './cloudflare-access/cloudflare-access.module.js';
import { DockerModule } from './docker/docker.module.js';
import { ContainersModule } from './containers/containers.module.js';
import { ImagesModule } from './images/images.module.js';

@Module({
  imports: [
    AppConfigModule,
    CloudflareAccessModule,
    DockerModule,
    ContainersModule,
    ImagesModule,
  ],
})
export class AppModule {}
