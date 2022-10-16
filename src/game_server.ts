import { isClientConnectionPacket } from './client_packet/c_connection'
import { readMasterData } from './master/masterdata_reader'
import { MasterEvent, isMasterEvent } from './master/master_event'

type Player = {
	ip: string;
	name: string;
};

class DateTime {

	private value: number;

	constructor(value) {
		this.value = value;
	}

	isBefore(dateTime: DateTime): boolean {
		return this.value < dateTime.value;
	}

	static Now(): DateTime {
		return new DateTime(Date.now());
	}

	static After(seconds: number): DateTime {
		return new DateTime(Date.now() + seconds * 1000);
	}
}

const calcNextEventTime = (event: MasterEvent): DateTime => {
	if (event.length_type === 'const') {
		return DateTime.After(event.length);
	} else {
		return DateTime.After(60 * 60 / event.length);
	}
}

class Game {

	private masterDataList: object[][];

	private players: Player[];

	private eventHistory: { event: MasterEvent, next: DateTime }[]

	constructor(masterDataList: object[][]) {
		this.masterDataList = masterDataList;
		this.players = [];
		this.eventHistory = [];
	}

	init() {
		{
			for (let event of this.getMasterEvent()) {
				if (this.eventHistory.some(h => h.event.type == event.type)) {
					continue;
				}
				this.eventHistory = [...this.eventHistory, { event, next: calcNextEventTime(event) }]
			}
		}
	}

	update() {
		{
			const now = DateTime.Now();

			{
				const currentEvents = this.eventHistory.filter(h => h.next.isBefore(now));
				for (let e of currentEvents) {
					if (e.event.type == 'tick') {
						console.log('tick');
						this.eventHistory = [...this.eventHistory, { event: e.event, next: calcNextEventTime(e.event) }];
					}
				}
				this.eventHistory = this.eventHistory.filter(h => !currentEvents.includes(h));
			}
		}
	}

	addPlayer(player: Player) {
		if (this.players.some(p => p.ip == player.ip)) {
			console.log(`${player.name}:${player.ip} try to connect, but already connected.`);
		} else {
			this.players = [...this.players, player]
			console.log(`${player.name}:${player.ip} connected.`);
		}
	}

	private getMasterEvent(): MasterEvent[] | null {
		const filtered = this.masterDataList.filter(d => d.every(isMasterEvent)) as MasterEvent[][];
		if (filtered.length == 0) {
			return null;
		} else {
			return filtered[0];
		}
	}
}

const sleep = (duration: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, duration));
}

export class GameServer {

	private isRunning;

	private game: Game;

	private packetQueue: { packet: object, ip: string, port: number }[];

	constructor() {
		this.isRunning = false;
		this.packetQueue = [];
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			console.log('server is already running');
			return;
		}
		try {
			console.log('loading masterdata...');
			const masterDataList = await readMasterData();
			console.log('completed loading masterdata...');

			this.isRunning = true;

			await this.gameRoutine(masterDataList);
		} catch (err) {
			throw err;
		}
	}

	receivePacket(packet: object, ip: string, port: number): void {
		this.packetQueue = [...this.packetQueue, { packet, ip, port }];
	}

	private async gameRoutine(masterDataList: object[][]): Promise<void> {
		this.game = new Game(masterDataList);
		this.game.init();
		while (true) {
			for (let p of this.packetQueue) {
				const packet = p.packet;
				if (isClientConnectionPacket(packet)) {
					this.game.addPlayer({ name: packet.name, ip: p.ip });
				}
			}
			this.packetQueue = [];
			this.game.update();
			await sleep(100);
		}
	}
}