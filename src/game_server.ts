import { isClientConnectionPacket } from './client_packet/c_connection'

type Player = {
	ip: string;
	name: string;
}

export class GameServer {

	private isRunning;

	private players: Player[];

	constructor() {
		this.isRunning = false;
		this.players = [];
	}

	start(): void {
		if (this.isRunning) {
			console.log('server is running');
			return;
		}
	}

	readPacket(packet: object, ip: string, port: number): void {
		if (isClientConnectionPacket(packet)) {
			if (this.players.some(p => p.ip == ip)) {
				console.log(`${packet.name}:${ip} try to connect, but already connected.`);
			} else {
				this.players = [...this.players, { ip, name: packet.name }]
				console.log(`${packet.name}:${ip} connected.`);
			}
		} else {
			return;
		}
	}
}