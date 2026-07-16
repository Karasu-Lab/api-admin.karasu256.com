import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CloudflareAccessGuard } from 'cloudflare-access/nestjs';
import { AppConfigService } from '../config/config.service.js';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (config: AppConfigService) => {
        if (!config.cloudflare) return { canActivate: () => true };
        return new CloudflareAccessGuard({ accessConfig: config.cloudflare });
      },
      inject: [AppConfigService],
    },
  ],
})
export class CloudflareAccessModule {}
