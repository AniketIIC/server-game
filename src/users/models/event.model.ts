import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Event extends Document {
  @Prop({ required: true })
  eventid: string;

  @Prop()
  eventName: string;

  @Prop()
  time: number;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop([String])
  users: string[];

  @Prop()
  membercount: number;

  @Prop({ default: false })
  status: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);
