import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Bracket {
    @Prop({ required: true })
    tournamentId: string

    @Prop({ required: true })
    userName1: string

    @Prop({ required: true })
    userName2: string

    @Prop({ required: true })
    round: number

    @Prop({ default: false })
    isFinished: boolean

    @Prop()
    winner: string
}

export const BracketSchema = SchemaFactory.createForClass(Bracket)
export type BracketDocument = Bracket & Document