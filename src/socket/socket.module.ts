import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { TournamentService } from './tournament';
import { SocketController } from './controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from 'src/events/models/event.model';
import { Bracket, BracketSchema } from './schemas/bracket.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Event.name, schema: EventSchema },
            { name: Bracket.name, schema: BracketSchema }
        ]),
    ],
    controllers: [SocketController],
    providers: [SocketGateway, TournamentService],
    exports: [TournamentService]
})
export class SocketModule { }
