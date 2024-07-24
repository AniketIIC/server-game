import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { TournamentService } from './tournament';
import { SocketController } from './controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from 'src/events/models/event.model';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    ],
    controllers: [SocketController],
    providers: [SocketGateway, TournamentService]
})
export class SocketModule { }
