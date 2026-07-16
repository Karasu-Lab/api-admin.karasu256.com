import { Controller, Get, Post, Body, Param, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import Docker from 'dockerode';
import { ContainersService } from './containers.service.js';
import { ContainerInfoDto } from './dto/container-info.dto.js';
import { LogQueryDto } from './dto/log-query.dto.js';
import { ReplaceContainerDto } from './dto/replace-container.dto.js';

@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @Get()
  listContainers(): Promise<ContainerInfoDto[]> {
    return this.containersService.listContainers();
  }

  @Get(':id')
  inspectContainer(
    @Param('id') id: string,
  ): Promise<Docker.ContainerInspectInfo> {
    return this.containersService.inspectContainer(id);
  }

  @Post(':id/start')
  startContainer(@Param('id') id: string): Promise<void> {
    return this.containersService.startContainer(id);
  }

  @Post(':id/stop')
  stopContainer(@Param('id') id: string): Promise<void> {
    return this.containersService.stopContainer(id);
  }

  @Sse(':id/update')
  streamUpdateContainer(@Param('id') id: string): Observable<MessageEvent> {
    return this.containersService.streamUpdateContainer(id);
  }

  @Sse(':id/logs')
  streamLogs(
    @Param('id') id: string,
    @Query() query: LogQueryDto,
  ): Observable<MessageEvent> {
    return this.containersService.streamLogs(id, query);
  }

  @Sse(':id/pull')
  streamPullUpdate(
    @Param('id') id: string,
    @Query('tag') tag?: string,
  ): Observable<MessageEvent> {
    return this.containersService.streamPullUpdate(id, tag);
  }

  @Sse(':id/replace')
  @Post(':id/replace')
  replaceContainer(
    @Param('id') id: string,
    @Body() dto: ReplaceContainerDto,
  ): Observable<MessageEvent> {
    return this.containersService.replaceContainer(id, dto);
  }
}
