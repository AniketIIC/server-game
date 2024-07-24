import { Controller, Post, Body, Res, HttpStatus, Get } from '@nestjs/common';
import { EventService } from '../services/event.service';
import { Response } from 'express';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

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
}
