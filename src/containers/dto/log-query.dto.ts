import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const LogQuerySchema = z.object({
  stderr: z.coerce.boolean().optional().default(true),
  tail: z.coerce.number().int().min(0).optional().default(100),
});

export class LogQueryDto extends createZodDto(LogQuerySchema) {}
