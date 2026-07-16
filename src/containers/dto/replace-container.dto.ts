import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ReplaceContainerSchema = z.object({
  newImage: z.string().min(1),
  createOptions: z.record(z.string(), z.unknown()).optional(),
});

export class ReplaceContainerDto extends createZodDto(ReplaceContainerSchema) {}
