import { createServer } from './server';
import { GameServer } from './game_server';
import { readPacketData } from './client_packet/client_packet_reader';

const server = createServer(25565);
const sender = server.start(rawPacket => {
	const clientPacket = readPacketData(rawPacket.data);
	if (clientPacket === null) {
		return;
	}
	if (gameServer) {
		gameServer.receivePacket(clientPacket);
	}
});
const gameServer = new GameServer();
gameServer.start(sender).then().catch(err => {
	console.log(err);
	server.stop();
});