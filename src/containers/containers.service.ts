import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PassThrough } from 'stream';
import Docker from 'dockerode';
import { DockerService } from '../docker/docker.service.js';
import { ContainerInfoDto } from './dto/container-info.dto.js';
import { LogQueryDto } from './dto/log-query.dto.js';
import { ReplaceContainerDto } from './dto/replace-container.dto.js';

@Injectable()
export class ContainersService {
  constructor(private readonly docker: DockerService) {}

  /** Returns a list of all running containers. */
  async listContainers(): Promise<ContainerInfoDto[]> {
    const containers = await this.docker.client.listContainers({ all: true });
    return containers.map((c) => ({
      id: c.Id,
      names: c.Names,
      image: c.Image,
      imageId: c.ImageID,
      status: c.Status,
      state: c.State,
      created: c.Created,
      ports: c.Ports.map((p) => ({
        IP: p.IP ?? '',
        PrivatePort: p.PrivatePort,
        PublicPort: p.PublicPort,
        Type: p.Type,
      })),
    }));
  }

  /** Starts a stopped container. */
  async startContainer(id: string): Promise<void> {
    try {
      await this.docker.client.getContainer(id).start();
    } catch {
      throw new NotFoundException(`Container ${id} not found`);
    }
  }

  /** Stops a running container. */
  async stopContainer(id: string): Promise<void> {
    try {
      await this.docker.client.getContainer(id).stop();
    } catch {
      throw new NotFoundException(`Container ${id} not found`);
    }
  }

  /** Returns detailed inspection data for a single container. */
  async inspectContainer(id: string): Promise<Docker.ContainerInspectInfo> {
    try {
      return await this.docker.client.getContainer(id).inspect();
    } catch {
      throw new NotFoundException(`Container ${id} not found`);
    }
  }

  /** Streams container logs as an SSE observable. */
  streamLogs(id: string, query: LogQueryDto): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const container = this.docker.client.getContainer(id);
      container.logs(
        {
          stdout: true,
          stderr: query.stderr ?? true,
          follow: true,
          tail: query.tail ?? 100,
          timestamps: true,
        },
        (err, stream) => {
          if (err) {
            subscriber.error(err);
            return;
          }
          if (!stream) {
            subscriber.complete();
            return;
          }
          const demuxed = new PassThrough();
          container.modem.demuxStream(stream, demuxed, demuxed);
          demuxed.on('data', (chunk: Buffer) => {
            subscriber.next({ data: chunk.toString('utf8') } as MessageEvent);
          });
          stream.on('end', () => subscriber.complete());
          stream.on('error', (e) => subscriber.error(e));
        },
      );
    });
  }

  /** Pulls the current image again, stops the old container, removes it, then starts a new one with the same config. Streams progress via SSE. */
  streamUpdateContainer(id: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const progress = (status: string, detail?: string) => {
        subscriber.next({
          type: 'progress',
          data: JSON.stringify({ status, detail }),
        } as MessageEvent);
      };
      const layer = (layerId: string, status: string, prog?: string) => {
        subscriber.next({
          type: 'layer',
          data: JSON.stringify({ layerId, status, progress: prog }),
        } as MessageEvent);
      };

      void (async () => {
        try {
          const inspectInfo = await this.inspectContainer(id);
          const image = inspectInfo.Config.Image;
          const name = inspectInfo.Name.replace(/^\//, '');

          progress('pulling', image);
          await new Promise<void>((resolve, reject) => {
            void this.docker.client.pull(
              image,
              (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) {
                  reject(err);
                  return;
                }
                this.docker.client.modem.followProgress(
                  stream,
                  (finishErr: Error | null) => {
                    if (finishErr) {
                      reject(finishErr);
                      return;
                    }
                    resolve();
                  },
                  (event: {
                    status: string;
                    id?: string;
                    progress?: string;
                  }) => {
                    if (event.id) {
                      layer(event.id, event.status, event.progress);
                    }
                  },
                );
              },
            );
          });

          progress('stopping');
          const oldContainer = this.docker.client.getContainer(id);
          await oldContainer.stop();
          await oldContainer.remove({ force: true });

          progress('starting');
          const newContainer = await this.docker.client.createContainer({
            name,
            Image: image,
            HostConfig: inspectInfo.HostConfig,
            Env: inspectInfo.Config.Env ?? undefined,
            ExposedPorts: inspectInfo.Config.ExposedPorts,
          });
          await newContainer.start();

          progress('done');
          subscriber.complete();
        } catch (e) {
          progress('error', e instanceof Error ? e.message : String(e));
          subscriber.complete();
        }
      })();
    });
  }

  /** Pulls the image with an optional tag override, then restarts the container. Streams progress via SSE. */
  streamPullUpdate(id: string, tag?: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const progress = (status: string, detail?: string) => {
        subscriber.next({
          type: 'progress',
          data: JSON.stringify({ status, detail }),
        } as MessageEvent);
      };
      const layer = (layerId: string, status: string, prog?: string) => {
        subscriber.next({
          type: 'layer',
          data: JSON.stringify({ layerId, status, progress: prog }),
        } as MessageEvent);
      };

      void (async () => {
        try {
          const inspectInfo = await this.inspectContainer(id);
          const image = inspectInfo.Config.Image;
          const name = inspectInfo.Name.replace(/^\//, '');

          const [repo] = image.split(':');
          const targetImage = tag ? `${repo}:${tag}` : image;

          progress('pulling', targetImage);
          await new Promise<void>((resolve, reject) => {
            void this.docker.client.pull(
              targetImage,
              (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) {
                  reject(err);
                  return;
                }
                this.docker.client.modem.followProgress(
                  stream,
                  (finishErr: Error | null) => {
                    if (finishErr) {
                      reject(finishErr);
                      return;
                    }
                    resolve();
                  },
                  (event: {
                    status: string;
                    id?: string;
                    progress?: string;
                  }) => {
                    if (event.id) {
                      layer(event.id, event.status, event.progress);
                    }
                  },
                );
              },
            );
          });

          progress('stopping');
          const oldContainer = this.docker.client.getContainer(id);
          await oldContainer.stop();
          await oldContainer.remove({ force: true });

          progress('starting');
          const newContainer = await this.docker.client.createContainer({
            name,
            Image: targetImage,
            HostConfig: inspectInfo.HostConfig,
            Env: inspectInfo.Config.Env ?? undefined,
            ExposedPorts: inspectInfo.Config.ExposedPorts,
          });
          await newContainer.start();

          progress('done');
          subscriber.complete();
        } catch (e) {
          progress('error', e instanceof Error ? e.message : String(e));
          subscriber.complete();
        }
      })();
    });
  }

  /** Pulls a new image, stops the old container, then starts a new one with the same config. Streams progress via SSE. */
  replaceContainer(
    id: string,
    dto: ReplaceContainerDto,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const emit = (status: string, detail?: string) => {
        subscriber.next({
          data: JSON.stringify({ status, detail }),
        } as MessageEvent);
      };

      void (async () => {
        try {
          emit('pulling', dto.newImage);
          await new Promise<void>((resolve, reject) => {
            void this.docker.client.pull(
              dto.newImage,
              (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) {
                  reject(err);
                  return;
                }
                this.docker.client.modem.followProgress(
                  stream,
                  (finishErr: Error | null) => {
                    if (finishErr) {
                      reject(finishErr);
                      return;
                    }
                    resolve();
                  },
                  (event: { status: string; progress?: string }) => {
                    emit('pulling', event.progress ?? event.status);
                  },
                );
              },
            );
          });

          emit('stopping');
          const oldContainer = this.docker.client.getContainer(id);
          const inspectInfo = await oldContainer.inspect();
          await oldContainer.stop();

          emit('starting');
          const newContainer = await this.docker.client.createContainer({
            ...dto.createOptions,
            Image: dto.newImage,
            HostConfig: inspectInfo.HostConfig,
            Env: inspectInfo.Config.Env ?? undefined,
            ExposedPorts: inspectInfo.Config.ExposedPorts,
          });
          await newContainer.start();

          emit('done');
          subscriber.complete();
        } catch (e) {
          subscriber.error(e);
        }
      })();
    });
  }
}
