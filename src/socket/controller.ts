import { Controller, Get } from "@nestjs/common";
import { TournamentService } from "./tournament";

@Controller('socket')
export class SocketController {
    constructor(private tournamentService: TournamentService) { }
    @Get('test')
    async test() {
        await this.tournamentService.shuffle({})
    }
}