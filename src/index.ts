import { Server } from './server';
import { GameServer } from './game_server';
import { readPacketData } from './client_packet/client_packet_reader';

const server = new Server(25565);
server.start(rawPacket => {
	const clientPacket = readPacketData(rawPacket.data);
	if (clientPacket === null) {
		return;
	}
	if (gameServer) {
		gameServer.readPacket(clientPacket, rawPacket.ip, rawPacket.port);
	}
});
const gameServer = new GameServer();
gameServer.start().then().catch(err => {
	console.log(err);
	server.stop();
});