import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './controllers/event.controller';
import { EventService } from './services/event.service';
import { Event, EventSchema } from './models/event.model';
import { SocketModule } from 'src/socket/socket.module';
import { Bracket, BracketSchema } from 'src/socket/schemas/bracket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Bracket.name, schema: BracketSchema }
    ]),
    SocketModule
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventsModule { }
