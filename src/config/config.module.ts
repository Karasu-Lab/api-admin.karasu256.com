import { Global, Module } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';
import { APP_CONFIG_TOKEN } from './config.constants.js';
import { AppConfigSchema } from './config.schema.js';
import { AppConfigService } from './config.service.js';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG_TOKEN,
      useFactory: () => {
        const raw = yaml.load(
          readFileSync(
            resolve(process.cwd(), 'configs', 'default.yml'),
            'utf8',
          ),
        );
        return AppConfigSchema.parse(raw);
      },
    },
    AppConfigService,
  ],
  exports: [AppConfigService],
})
export class AppConfigModule {}
