import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const PullImageSchema = z.object({
  image: z.string().min(1),
});

export class PullImageDto extends createZodDto(PullImageSchema) {}
