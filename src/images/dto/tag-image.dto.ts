import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const TagImageSchema = z.object({
  repo: z.string().min(1),
  tag: z.string().min(1),
});

export class TagImageDto extends createZodDto(TagImageSchema) {}
