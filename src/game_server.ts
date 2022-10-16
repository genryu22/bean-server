import { isClientConnectionPacket } from './client_packet/c_connection'
import { readMasterData } from './master/masterdata_reader'

type Player = {
	ip: string;
	name: string;
}

export class GameServer {

	private isRunning;

	private players: Player[];

	private masterDataList: object[];

	constructor() {
		this.isRunning = false;
		this.players = [];
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			console.log('server is already running');
			return;
		}
		try {
			console.log('loading masterdata...');
			this.masterDataList = await readMasterData();
			console.log('completed loading masterdata...');
			this.isRunning = true;
		} catch (err) {
			throw err;
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