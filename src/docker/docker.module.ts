import { Global, Module } from '@nestjs/common';
import { dockerProvider } from './docker.provider.js';
import { DockerService } from './docker.service.js';

@Global()
@Module({
  providers: [dockerProvider, DockerService],
  exports: [DockerService],
})
export class DockerModule {}
