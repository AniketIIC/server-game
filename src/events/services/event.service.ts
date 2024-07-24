import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as schedule from 'node-schedule';
import { Event } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

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
      await this.updateEventStatus(eventid, true);
    });
  }

  async updateEventStatus(eventid: string, status: boolean): Promise<void> {
    await this.eventModel.updateOne({ eventid }, { status });
  }
}
