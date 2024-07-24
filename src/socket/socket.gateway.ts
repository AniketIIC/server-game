import { InjectModel } from "@nestjs/mongoose";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { Bracket, BracketDocument } from "./schemas/bracket.schema";
import mongoose, { Model } from "mongoose";

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

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const workspace = client.nsp
        const userName = client['data']['userName']
        workspace.emit('USER-LEAVE', { userName })
        const bracket = await this.bracketModel.findOne({
            $or: [{ userName1: userName }, { userName2: userName }],
            isFinished: false
        })

        const opponent = bracket.userName1 === userName ? bracket.userName2 : bracket.userName1

        if (bracket) {
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

}