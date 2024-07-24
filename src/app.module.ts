import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { EventModule } from './events/event.module';


@Module({
  imports: [SocketModule, EventModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
