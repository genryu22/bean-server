import { v4 as uuidv4 } from 'uuid';
import { isClientConnectionPacket } from './client_packet/c_connection';
import { readMasterData } from './master/masterdata_reader';

import { MasterEvent, isMasterEvent } from './master/master_event';
import { MasterTitle, isMasterTitle } from './master/master_title';
import { MasterPlant, isMasterPlant } from './master/master_plant';
import { MasterShopItem, isMasterShopItem } from './master/master_shop_item';

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
	farm_tile_ids: string[]; // FarmTileのid
	harvest_count: number;
	color: { r: number, g: number, b: number };
	has_caterpillar: boolean;
	body_titles: string[]; // MasterTitle[]にはできない。あくまで参照するため。
	seed_titles: string[]; // MasterTitle[]にはできない。あくまで参照するため。
}

type Item = { // あえてidをつけていない。種類と称号で分ける。
	type: string;
	titles: string[];
	count: number;
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
		return after(60 * 60 / event.length); //TODO ランダム化
	}
}

class PacketSender {

	sendShopItem(player: Player, master_shop_item: MasterShopItem): void {

	}
}

// セーブとロードができるようにmasterDataList, packetsender以外のオブジェクトはpureなTypeにする。
class Game {

	private masterDataList: object[][];

	private packetSender: PacketSender;

	private money: number;

	private players: Player[];

	private event_history: { event: MasterEvent, next: DateTime }[]

	private fieldTiles: FieldTile[];

	private farmTiles: FarmTile[];

	private plants: Plant[];

	private items: Item[];

	private item_history: string[];

	constructor(masterDataList: object[][]) {
		this.masterDataList = masterDataList;
		this.players = [];
		this.event_history = [];
		this.fieldTiles = [];
		this.farmTiles = [];
		this.plants = [];
		this.items = [];
	}

	init() {
		this.packetSender = new PacketSender();

		{
			for (let event of getMaster(this.masterDataList, isMasterEvent)) {
				if (this.event_history.some(h => h.event.type == event.type)) {
					continue;
				}
				this.event_history = [...this.event_history, { event, next: calcNextEventTime(event) }]
			}
		}

		{
			const size = {
				width: 30,
				height: 30,
			} as const;
			for (let x = 0; x < size.width; ++x) {
				for (let y = 0; y < size.height; ++y) {
					if (this.fieldTiles.some(t => t.position.x == x && t.position.y == y)) {
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
				const currentEvents = this.event_history.filter(h => compare(h.next, now));
				for (let e of currentEvents) {
					if (e.event.type == 'tick') {
						this.tick();
						this.event_history = [...this.event_history, { event: e.event, next: calcNextEventTime(e.event) }];
					}
				}
				this.event_history = this.event_history.filter(h => !currentEvents.includes(h));
			}
		}
	}

	tick() {
		console.log('tick');
		for (let farmTile of this.farmTiles) {
			farmTile.weed_amount += 1;
		}
		for (let plant of this.plants) {
			if (plant.has_caterpillar) {
				plant.growth -= 1;
			} else if (this.convertFarmTileIDs(plant.farm_tile_ids).every(t => t.fertility > 0 && t.water > 0 && t.weed_amount < 20)) {
				plant.growth += 1;
				for (let t of this.convertFarmTileIDs(plant.farm_tile_ids)) {
					t.fertility -= 1;
					t.water -= 1;
				}

				const plant_master = getMaster(this.masterDataList, isMasterPlant).filter(mp => mp.type == plant.plant_type);
				if (plant_master.length == 0) {
					console.log(`${plant.plant_type} 植物マスターが存在しません。`);
				} else {
					if (plant.seed_titles.length < 3) {
						const newTitle = this.randomTitle();
						if (newTitle !== null) {
							plant.seed_titles = [...plant.seed_titles, newTitle];
						}
					}
				}
			}
		}
	}

	harvest(ip: string, plant_id: string): void {
		const player = this.findPlayerByIP(ip);
		if (player == null) {
			console.log(`${ip} プレイヤーが存在しません。`);
			return;
		}
		const plant = this.findPlantByID(plant_id);
		if (plant === null) {
			console.log(`${player.name}:${ip} 植物が存在しません。`);
			return;
		}

		if (plant.growth < 100) {
			console.log(`${player.name}:${ip} 成長量が十分ではありません。`)
			return;
		}

		const plant_master = getMaster(this.masterDataList, isMasterPlant).filter(mp => mp.type == plant.plant_type);
		if (plant_master.length == 0) {
			console.log(`${player.name}:${ip} 植物マスターが存在しません。`);
			return;
		}

		const item = this.findItemByTypeAndTitles(plant_master[0].crop, plant.seed_titles)
		if (item === null) {
			this.items = [...this.items, {
				type: plant_master[0].crop,
				titles: [...plant.seed_titles],
				count: plant_master[0].crop_count,
			}]
		} else {
			item.count += plant_master[0].crop_count
		}
	}

	addPlayer(player: Player): void {
		if (this.players.some(p => p.ip == player.ip)) {
			console.log(`${player.name}:${player.ip} try to connect, but already connected.`);
		} else {
			this.players = [...this.players, player]
			console.log(`${player.name}:${player.ip} connected.`);
		}
	}

	private randomTitle(): string | null {
		return null
	}

	private convertFarmTileIDs(ids: string[]): FarmTile[] {
		return ids.map(this.findFarmTileByID).filter(ft => ft !== null);
	}

	private findFarmTileByID(id: string): FarmTile | null {
		return findByID(this.farmTiles, id);
	}

	private findPlantByID(id: string): Plant | null {
		return findByID(this.plants, id);
	}

	private findItemByTypeAndTitles(type: string, titles: string[]): Item | null {
		const res = this.items.filter(i => i.type == type && compareArrays(i.titles, titles));
		if (res.length > 0) {
			return res[0];
		} else {
			return null;
		}
	}

	private findPlayerByIP(ip: string): Player | null {
		const res = this.players.filter(p => p.ip == ip);
		if (res.length > 0) {
			return res[0];
		} else {
			return null;
		}
	}
}

const sleep = (duration: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, duration));
}

const createID = (): string => {
	return uuidv4();
}

const findByID = <T extends { id: string }>(list: T[], id: string): T | null => {
	const res = list.filter(d => d.id == id);
	if (res.length > 0) {
		return res[0];
	} else {
		return null;
	}
}

const getMaster = <T>(masterDataList: object[][], isT: (data: any) => data is T): T[] | null => {
	const filtered = masterDataList.filter(d => d.every(isT)) as T[][];
	if (filtered.length == 0) {
		return null;
	} else {
		return filtered[0];
	}
}

const compareArrays = (a: string[], b: string[]): boolean => {
	return a.every(s => b.includes(s)) && b.every(s => a.includes(s))
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