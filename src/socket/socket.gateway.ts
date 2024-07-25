import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { Bracket, BracketDocument } from "./schemas/bracket.schema";
import mongoose, { Model } from "mongoose";
import { TournamentService } from "./tournament";

@WebSocketGateway({
    namespace: /^\/TR-.*$/,
    cors: {
        origin: '* ',
    },
})

export class SocketGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    constructor(
        @InjectModel(Bracket.name) private bracketModel: Model<BracketDocument>
    ) { }
    @WebSocketServer()
    nsp: Namespace

    async handleConnection(client: Socket, ...args: any[]) {
        const workspace = client.nsp
        const { userName } = client.handshake.query
        client['data'] = { userName }
        workspace.emit('USER-JOIN', { userName })
        console.log("Client connected: ", client.id)
    }

    async afterInit(nsp: Namespace) { }

    @SubscribeMessage("MOVE")
    handleMove(@ConnectedSocket() client: Socket, @MessageBody() body: Record<string, any>) {
        const { tile, move, opponentName } = body
        const userName = client['data']['userName']
        const workspace = client.nsp
        console.log("Received Move: ", body)
        workspace.to(`${userName}-${opponentName}`).emit('MOVE', {
            tile,
            move,
            moveBy: userName
        })

        workspace.to(`${opponentName}-${userName}`).emit('MOVE', {
            tile,
            move,
            moveBy: userName
        })

    }

    @SubscribeMessage("WIN")
    async handleWin(@ConnectedSocket() client: Socket, @MessageBody() body: Record<string, any>) {
        const { winner, loser } = body
        const workspace = client.nsp
        const tournamentId = workspace.name.slice(1)
        console.log({ win: body })
        client.emit("WIN")
        const connectedMembers = await workspace.fetchSockets()
        for (const member of connectedMembers) {
            const clientData = member.data
            if (clientData['userName'] === winner) {
                workspace.to(member.id).emit("WIN")
            }

            if (clientData['userName'] === loser) {
                workspace.to(member.id).emit("LOSE")
            }
        }

        // console.log({
        //     q: JSON.stringify({
        //         $or: [
        //             { userName1: winner, userName2: loser },
        //             { userName1: loser, userName2: winner }
        //         ],
        //         isFinished: false
        //     })
        // })

        const bracket = await this.bracketModel.findOneAndUpdate(
            {
                $or: [
                    { userName1: winner, userName2: loser },
                    { userName1: loser, userName2: winner }
                ],
                isFinished: false,
                tournamentId: tournamentId
            },
            {
                $set: {
                    isFinished: true,
                    winner: winner
                }
            },
            {
                new: true
            }
        )

        console.log({ bracket })

        // if (bracket) {
        //     bracket.isFinished = true
        //     bracket.winner = winner
        //     await bracket.save()
        // }

        const res = await this.checkIfTournamentIsOver(tournamentId, bracket.round)

        if (res) {
            client.emit("TOURNAMENT-WIN")
        }
        else {
            await this.moveToNextRound(tournamentId, bracket.round)
        }

    }

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const workspace = client.nsp
        const userName = client['data']['userName']
        workspace.emit('USER-LEAVE', { userName })
        const bracket = await this.bracketModel.findOne({
            $or: [{ userName1: userName }, { userName2: userName }],
            isFinished: false
        })


        if (bracket) {
            const opponent = bracket.userName1 === userName ? bracket.userName2 : bracket.userName1
            const connectedMembers = await workspace.fetchSockets()
            for (const member of connectedMembers) {
                const clientData = member.data
                if (clientData['userName'] === userName) {
                    workspace.to(member.id).emit("WIN")
                    await this.bracketModel.findOneAndUpdate(
                        {
                            _id: new mongoose.Types.ObjectId(bracket.id)
                        },
                        {
                            $set: {
                                isFinished: true,
                                winner: opponent
                            }
                        }
                    )
                }
            }
        }

        console.log("Client disconnected: ", client.id)
    }

    async checkIfTournamentIsOver(tournamentId, round) {
        const brackets = await this.bracketModel.find(
            {
                tournamentId,
                round
            }
        )

        if (brackets.length === 1) {
            return true;
        }

        return false;
    }

    async findMember(memberName, tournamentId) {
        const socket = this.nsp.server
        const socketMembers = await socket.of(`/${tournamentId}`).fetchSockets()
        for (const member of socketMembers) {
            const clientData = member.data
            if (clientData.userName === memberName) {
                return member
            }
        }
        return null
    }

    async moveToNextRound(tournamentId, round) {
        const brackets = await this.bracketModel.find({
            tournamentId,
            round
        })

        let isReadyForNextRound = true

        for (const bracket of brackets) {
            if (bracket.isFinished === false) {
                isReadyForNextRound = false
                break;
            }
        }

        if (isReadyForNextRound) {
            await this.startNextRound(tournamentId, round)
        }
    }

    async startNextRound(tournamentId, round) {
        const brackets = await this.bracketModel.find({
            tournamentId,
            round
        })
        const socket = this.nsp.server

        const users = []

        for (let bracket of brackets) {
            users.push(bracket.winner)
        }

        if (users.length) {
            let totalUsers = users.length
            if (totalUsers % 2 !== 0) {
                users.pop()
                totalUsers--
            }

            const pairsArr = []

            for (let i = 0; i < totalUsers / 2; i++) {
                pairsArr.push([users[i], users[totalUsers - (i + 1)]])
            }

            const brackets = [];

            for (const pair of pairsArr) {
                const memberName1 = pair[0]
                const memberName2 = pair[1]
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
                        round: round + 1,
                        isFinished: false
                    })
                }
            }

            if (brackets.length) {
                await this.bracketModel.insertMany(brackets)
            }
        }
    }

}