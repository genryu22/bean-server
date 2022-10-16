import { v4 as uuidv4 } from 'uuid';
import { isClientConnectionPacket } from './client_packet/c_connection';
import { readMasterData } from './master/masterdata_reader';

import { MasterEvent, isMasterEvent } from './master/master_event';
import { MasterTitle, isMasterTitle } from './master/master_title';
import { MasterPlant, isMasterPlant } from './master/master_plant';

type Position = {
	x: number;
	y: number;
}

type Player = {
	ip: string;
	name: string;
}

type FieldTile = {
	id: string;
	position: Position;
	fixed_object_type: string | null;
	fixed_object_id: string | null;
}

type FarmTile = {
	id: string;
	water: number;
	fertility: number;
	weed_amount: number;
}

type Plant = {
	id: string;
	plant_type: string;
	growth: number;
	tiles: string[]; // FarmTileのID
	harvest_count: number;
	color: { r: number, g: number, b: number };
	has_caterpillar: boolean;
	titles: string[]; // MasterTitle[]にはできない。あくまで参照するため。
}

type DateTime = {
	value: number;
}

const getCurrentTime = (): DateTime => {
	return { value: Date.now() };
}

const after = (seconds: number): DateTime => {
	return { value: Date.now() + seconds * 1000 };
}

const compare = (a: DateTime, b: DateTime): boolean => {
	return a.value < b.value;
}

const calcNextEventTime = (event: MasterEvent): DateTime => {
	if (event.length_type === 'const') {
		return after(event.length);
	} else {
		return after(60 * 60 / event.length);
	}
}

// セーブとロードができるようにmasterDataList以外のオブジェクトはpureなTypeにする。
class Game {

	private masterDataList: object[][];

	private players: Player[];

	private eventHistory: { event: MasterEvent, next: DateTime }[]

	private fieldTiles: FieldTile[];

	private plants: Plant[];

	constructor(masterDataList: object[][]) {
		this.masterDataList = masterDataList;
		this.players = [];
		this.eventHistory = [];
		this.fieldTiles = [];
	}

	init() {
		{
			for (let event of getMaster(this.masterDataList, isMasterEvent)) {
				if (this.eventHistory.some(h => h.event.type == event.type)) {
					continue;
				}
				this.eventHistory = [...this.eventHistory, { event, next: calcNextEventTime(event) }]
			}
		}

		{
			const size = {
				width: 30,
				height: 30,
			} as const;
			for (let x = 0; x < size.width; ++x) {
				for (let y = 0; y < size.height; ++y) {
					if (this.fieldTiles.some(t => t.position.x == x && t.position.y == y) {
						continue;
					}
					this.fieldTiles = [...this.fieldTiles, {
						id: createID(),
						position: { x, y },
						fixed_object_type: null,
						fixed_object_id: null,
					}]
				}
			}
		}
	}

	update() {
		{
			const now = getCurrentTime();

			{
				const currentEvents = this.eventHistory.filter(h => compare(h.next, now));
				for (let e of currentEvents) {
					if (e.event.type == 'tick') {
						console.log('tick');
						this.tick();
						this.eventHistory = [...this.eventHistory, { event: e.event, next: calcNextEventTime(e.event) }];
					}
				}
				this.eventHistory = this.eventHistory.filter(h => !currentEvents.includes(h));
			}
		}
	}

	tick() {
	}

	addPlayer(player: Player) {
		if (this.players.some(p => p.ip == player.ip)) {
			console.log(`${player.name}:${player.ip} try to connect, but already connected.`);
		} else {
			this.players = [...this.players, player]
			console.log(`${player.name}:${player.ip} connected.`);
		}
	}
}

const sleep = (duration: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, duration));
}

const createID = (): string => {
	return uuidv4();
}

const getMaster = <T>(masterDataList: object[][], isT: (data: any) => data is T): T[] | null => {
	const filtered = masterDataList.filter(d => d.every(isT)) as T[][];
	if (filtered.length == 0) {
		return null;
	} else {
		return filtered[0];
	}
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