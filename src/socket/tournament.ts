// export const shuffle = async (data) => { 

import { Injectable } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { Event, EventDocument } from "src/events/models/event.model";
import { Model } from "mongoose";
import { Bracket, BracketDocument } from "./schemas/bracket.schema";

// }

@Injectable()
export class TournamentService {
    constructor(
        private socketGateway: SocketGateway,
        @InjectModel(Event.name) private eventModel: Model<EventDocument>,
        @InjectModel(Bracket.name) private bracketModel: Model<BracketDocument>
    ) { }

    async shuffle(data) {
        const { tournamentId } = data
        const socket = this.socketGateway.nsp.server
        const tournament = await this.eventModel.findOne({
            eventid: tournamentId
        })

        if (tournament.status === true) {
            return;
        }

        // const tournamentId = tournament.eventid
        const array = tournament.users
        let arrayLen = array.length
        let kickedMember;
        if (arrayLen % 2 !== 0) {
            array.pop()
            kickedMember = array[arrayLen - 1]
            arrayLen--
        }

        const pairsArr = []

        for (let i = 0; i < arrayLen / 2; i++) {
            pairsArr.push([array[i], array[arrayLen - (i + 1)]])
        }

        const brackets = [];

        for (const pairs of pairsArr) {
            const memberName1 = pairs[0]
            const memberName2 = pairs[1]
            const member1Client = await this.findMember(memberName1, tournamentId)
            const member2Client = await this.findMember(memberName2, tournamentId)

            if (member1Client && member2Client) {
                const roomName = `${memberName1}-${memberName2}`
                member1Client.join(roomName)
                member2Client.join(roomName)
                socket.of(`/${tournamentId}`).to(member1Client.id).emit("START", {
                    users: [memberName1, memberName2]
                })
                socket.of(`/${tournamentId}`).to(member2Client.id).emit("START", {
                    users: [memberName1, memberName2]
                })
                brackets.push({
                    tournamentId: tournamentId,
                    userName1: memberName1,
                    userName2: memberName2,
                    round: 1,
                    isFinished: false
                })
            }
        }

        await this.eventModel.findOneAndUpdate({ eventid: tournamentId }, {
            $set: {
                status: true
            }
        })

        await this.bracketModel.insertMany(brackets)

    }

    async findMember(memberName, tournamentId) {
        const socket = this.socketGateway.nsp.server
        const socketMembers = await socket.of(`/${tournamentId}`).fetchSockets()
        for (const member of socketMembers) {
            const clientData = member.data
            if (clientData.userName === memberName) {
                return member
            }
        }
        return null
    }
}