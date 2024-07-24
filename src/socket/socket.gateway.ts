import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";

@WebSocketGateway({
    namespace: /^\/TR-.*$/,
    cors: {
        origin: '* ',
    },
})

export class SocketGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    nsp: Namespace

    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const workspace = client.nsp
        workspace.emit('USER-LEAVE', { userName: client['data']['userName'] })
        console.log("Client disconnected: ", client.id)

    }

    async handleConnection(client: Socket, ...args: any[]) {
        const workspace = client.nsp
        const { userName } = client.handshake.query
        client['data'] = { userName }
        workspace.emit('USER-JOIN', { userName })
        console.log("Client connected: ", client.id)
    }

    async afterInit(nsp: Namespace) { }
}