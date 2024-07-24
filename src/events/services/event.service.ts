import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as schedule from 'node-schedule';
import { Event } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { TournamentService } from 'src/socket/tournament';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    private tournamentService: TournamentService,
  ) {}

  async createEvent(createEventDto: any): Promise<Event> {
    const eventid = `TR-${uuidv4()}`;
    const { time } = createEventDto;
    const eventStartTime = moment().add(time, 'minutes').toISOString();
    const newEvent = new this.eventModel({
      ...createEventDto,
      eventid,
      startTime: eventStartTime,
    });
    const savedEvent = await newEvent.save();

    if (eventStartTime) {
      this.scheduleEvent(new Date(eventStartTime), eventid);
    }

    return savedEvent;
  }

  scheduleEvent(startTime: Date, eventid: string): void {
    const startDate = new Date(startTime);
    schedule.scheduleJob(startDate, async () => {
      console.log(`Event ${eventid} is starting now!`);
      // await this.updateEventStatus(eventid, true);
      await this.tournamentService.shuffle({
        tournamentId: eventid,
      });
    });
  }

  async updateEventStatus(eventid: string, status: boolean): Promise<void> {
    await this.eventModel.updateOne({ eventid }, { status });
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventModel.find().exec();
  }

  async joinTournament(inputs: Record<string, any>) {
    const { userName, tournamentId } = inputs;

    const event = await this.eventModel.findOne({ eventid: tournamentId });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.users.includes(userName)) {
      throw new BadRequestException('User already joined');
    }
    await this.eventModel.findOneAndUpdate(
      {
        eventid: tournamentId,
      },
      {
        $push: {
          users: userName,
        },
      },
    );
  }
}
