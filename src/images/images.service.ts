import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import Docker from 'dockerode';
import { DockerService } from '../docker/docker.service.js';
import { TagImageDto } from './dto/tag-image.dto.js';

@Injectable()
export class ImagesService {
  constructor(private readonly docker: DockerService) {}

  /** Returns all locally available Docker images. */
  listImages(): Promise<Docker.ImageInfo[]> {
    return this.docker.client.listImages();
  }

  /** Removes a Docker image by its short ID (12-char hex, no sha256: prefix). */
  async deleteImage(id: string): Promise<void> {
    await this.docker.client.getImage(id).remove();
  }

  /** Creates a new tag on an existing image. */
  async tagImage(id: string, dto: TagImageDto): Promise<void> {
    await this.docker.client.getImage(id).tag({ repo: dto.repo, tag: dto.tag });
  }

  /** Pulls a Docker image and streams layer-level progress via SSE. */
  pullImage(imageName: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      void this.docker.client.pull(
        imageName,
        (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            subscriber.error(err);
            return;
          }
          this.docker.client.modem.followProgress(
            stream,
            (finishErr: Error | null) => {
              if (finishErr) {
                subscriber.error(finishErr);
                return;
              }
              subscriber.next({
                data: JSON.stringify({ status: 'done' }),
              } as MessageEvent);
              subscriber.complete();
            },
            (event: {
              status: string;
              id?: string;
              progress?: string;
              progressDetail?: unknown;
            }) => {
              subscriber.next({ data: JSON.stringify(event) } as MessageEvent);
            },
          );
        },
      );
    });
  }
}
