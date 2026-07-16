import { Injectable, Inject } from '@nestjs/common';
import Docker from 'dockerode';
import { DOCKER_CLIENT } from './docker.provider.js';

@Injectable()
export class DockerService {
  constructor(@Inject(DOCKER_CLIENT) readonly client: Docker) {}
}
