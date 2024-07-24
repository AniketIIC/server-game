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
        // await this.connectionHandlerService.handleDisconnect(client);
    }

    async handleConnection(client: any, ...args: any[]) {
        // await this.connectionHandlerService.handleConnection(client, ...args);
    }

    async afterInit(nsp: Namespace) { }
}