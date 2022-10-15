import { Server } from './server';
import { GameServer } from './game_server';
import { readPacketData } from './client_packet/client_packet_reader';

const gameServer = new GameServer();
gameServer.start();
const server = new Server(25565);
server.start(rawPacket => {
	const clientPacket = readPacketData(rawPacket.data);
	if (clientPacket === null) {
		return;
	}
	gameServer.readPacket(clientPacket, rawPacket.ip, rawPacket.port);
});