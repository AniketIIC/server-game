import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { EventService } from '../services/event.service';
import { Response } from 'express';
import { TournamentService } from 'src/socket/tournament';
import { InjectModel } from '@nestjs/mongoose';
import { Bracket, BracketDocument } from 'src/socket/schemas/bracket.schema';
import { Model } from 'mongoose';

@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private tournamentService: TournamentService,
    @InjectModel(Bracket.name) private bracketModel: Model<BracketDocument>
  ) { }

  @Post()
  async createEvent(
    @Body() createEventDto: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const savedEvent = await this.eventService.createEvent(createEventDto);
      res.status(HttpStatus.CREATED).json(savedEvent);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error creating event');
    }
  }

  @Get()
  async getAllEvents(@Res() res: Response): Promise<void> {
    try {
      const events = await this.eventService.getAllEvents();
      res.status(HttpStatus.OK).json(events);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error retrieving events');
    }
  }

  @Post('start')
  async startTournament(@Body() body: Record<string, any>) {
    const { tournamentId } = body;
    await this.tournamentService.shuffle({
      tournamentId,
    });
  }

  @Post('join')
  async joinEvent(@Body() body: Record<string, any>) {
    await this.eventService.joinTournament(body);
    return {};
  }

  @Delete(':eventid')
  async deleteEventById(
    @Param('eventid') eventid: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const event = await this.eventService.deleteEventById(eventid);
      res.status(HttpStatus.OK).json(event);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error deleting event');
    }
  }

  @Get('leaderboard/:tournamentId')
  async leaderBoard(@Param('tournamentId') tournamentId: string) {
    const obj: Record<string, any> = {}
    const brackets = await this.bracketModel.find({ tournamentId: tournamentId })
    if (brackets && brackets.length) {
      for (const bracket of brackets) {
        if (obj[bracket.round]) {
          obj[bracket.round].push(bracket)
        }
        else {
          obj[bracket.round] = [bracket]
        }
      }
    }
    return {
      data: obj
    }
  }
}
