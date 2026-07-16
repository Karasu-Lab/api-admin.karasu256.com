import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import Docker from 'dockerode';
import { ImagesService } from './images.service.js';
import { PullImageDto } from './dto/pull-image.dto.js';
import { TagImageDto } from './dto/tag-image.dto.js';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  listImages(): Promise<Docker.ImageInfo[]> {
    return this.imagesService.listImages();
  }

  @Sse('pull')
  @Get('pull')
  pullImage(@Query() dto: PullImageDto): Observable<MessageEvent> {
    return this.imagesService.pullImage(dto.image);
  }

  @Delete(':id')
  deleteImage(@Param('id') id: string): Promise<void> {
    return this.imagesService.deleteImage(id);
  }

  @Post(':id/tag')
  tagImage(@Param('id') id: string, @Body() dto: TagImageDto): Promise<void> {
    return this.imagesService.tagImage(id, dto);
  }
}
