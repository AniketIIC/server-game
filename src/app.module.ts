import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { EventsModule } from './events/event.module';
import { DatabaseModule } from './common/database/mongodb.provider';

@Module({
  imports: [
    SocketModule,
    DatabaseModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
