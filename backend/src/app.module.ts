
import { Module, HttpException, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AuthController } from './auth.controller';
import { DbService } from './db.service';
import { HealthController } from './health.controller';
import { NotesController } from './notes.controller';

class ExceptionThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      'Ai efectuat prea multe încercări de autentificare. Te rugăm să aștepți 5 minute înainte de a încerca din nou.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    NotesController,
  ],
  providers: [
    DbService,
    {
      provide: APP_GUARD,
      useClass: ExceptionThrottlerGuard,
    },
  ],
})
export class AppModule {}
