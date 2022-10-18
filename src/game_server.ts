import { v4 as uuidv4 } from 'uuid';
import { isClientConnectionPacket } from './client_packet/c_connection';
import { readMasterData } from './master/masterdata_reader';

import { MasterEvent, isMasterEvent } from './master/master_event';
import { MasterTitle, isMasterTitle } from './master/master_title';
import { MasterPlant, isMasterPlant } from './master/master_plant';
import { MasterShopItem, isMasterShopItem } from './master/master_shop_item';
import { isMasterItem } from './master/master_item';
import { ServerPacket } from './server_packet/server_packet';
import { EventEmitter } from 'node:events';
import { createPacketAddPlayer, createPacketAll, createPacketAllPlants } from './server_packet/server_packet_creator';

type GameData = {
	money: number,
	players: Player[],
	event_history: { event: MasterEvent, next: DateTime }[],
	fieldTiles: FieldTile[],
	farmTiles: FarmTile[],
	plants: Plant[],
	items: Item[],
	item_history: string[],
}

type Position = {
	x: number;
	y: number;
}

type Player = {
	ip: string;
	name: string;
	port: number;
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

// セーブとロードができるようにmasterDataList, packetsender以外のオブジェクトはpureなTypeにする。
class Game {

	private syncEmitter: EventEmitter;

	private masterDataList: object[][];

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
		this.money = 0;
		this.players = [];
		this.event_history = [];
		this.fieldTiles = [];
		this.farmTiles = [];
		this.plants = [];
		this.items = [];
		this.item_history = [];
	}

	init(): EventEmitter {
		this.syncEmitter = new EventEmitter();

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

		return this.syncEmitter;
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
						this.syncEmitter.emit('sync:tick', this.toGameData());
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

		this.addItem(plant_master[0].crop, plant.seed_titles, plant_master[0].crop_count);
	}

	addPlayer(player: Player): void {
		if (this.players.some(p => p.ip == player.ip)) {
			console.log(`${player.name}:${player.ip} try to connect, but already connected.`);
		} else {
			this.players = [...this.players, player]
			console.log(`${player.name}:${player.ip} connected.`);
			this.syncEmitter.emit('sync:whenPlayerConnected', player, this.toGameData());
		}
	}

	buy(ip: string, item_type: string, count: number): void {
		if (count <= 0) {
			console.log(`${ip} 購入数が不正`);
			return;
		}
		const player = this.findPlayerByIP(ip);
		if (player == null) {
			console.log(`${ip} プレイヤーが存在しません。`);
			return;
		}

		const shopItems = getMaster(this.masterDataList, isMasterShopItem);
		if (shopItems.every(si => si.item_type != item_type)) {
			console.log(`${player.name}:${ip} ショップにアイテム ${item_type} が登録されていません。`);
			return;
		}

		const itemMasters = getMaster(this.masterDataList, isMasterItem).filter(im => im.type == item_type);
		if (itemMasters.length == 0) {
			console.log(`${player.name}:${ip} マスターにアイテム ${item_type} が登録されていません。`);
			return;
		}

		if (itemMasters[0].buy_price * count > this.money) {
			console.log(`${player.name}:${ip} ${item_type} ${this.money} お金が足りません`);
			return;
		}

		this.money -= itemMasters[0].buy_price * count;
		this.addItem(item_type, [], count);
	}

	private addItem(item_type: string, titles: string[], count: number) {
		const item = this.findItemByTypeAndTitles(item_type, titles)
		if (item === null) {
			this.items = [...this.items, {
				type: item_type,
				titles: [...titles],
				count: count,
			}]
		} else {
			item.count += count
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

	private toGameData(): GameData {
		return {
			money: this.money,
			players: this.players,
			event_history: this.event_history,
			fieldTiles: this.fieldTiles,
			farmTiles: this.farmTiles,
			plants: this.plants,
			items: this.items,
			item_history: this.item_history,
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

class GameServer {

	private isRunning;

	private game: Game;

	private packetQueue: object[];

	constructor() {
		this.isRunning = false;
		this.packetQueue = [];
	}

	async start(sender: (packet: ServerPacket) => void): Promise<void> {
		if (this.isRunning) {
			console.log('server is already running');
			return;
		}
		try {
			console.log('loading masterdata...');
			const masterDataList = await readMasterData();
			console.log('completed loading masterdata...');

			this.isRunning = true;

			await this.gameRoutine(masterDataList, sender);
		} catch (err) {
			throw err;
		}
	}

	receivePacket(packet: object): void {
		this.packetQueue = [...this.packetQueue, packet];
	}

	private async gameRoutine(masterDataList: object[][], sender: (packet: ServerPacket) => void): Promise<void> {
		this.game = new Game(masterDataList);
		const syncEmitter = this.game.init();

		// パケット送信処理の定義
		syncEmitter.on('sync:whenPlayerConnected', (player: Player, allData: GameData) => {
			sender(createPacketAll(player, allData));
			for (let otherPlayer of allData.players.filter(p => p !== player)) {
				sender(createPacketAddPlayer(otherPlayer, player));
			}
		});
		syncEmitter.on('sync:tick', (allData: GameData) => {
			for (let player of allData.players) {
				sender(createPacketAllPlants(player, allData.plants));
				// イベント情報も送信する？
			}
		});

		// 受け取ったパケットの処理
		while (true) {
			for (let p of this.packetQueue) {
				if (isClientConnectionPacket(p)) {
					this.game.addPlayer({ name: p.name, ip: p.ip, port: p.port });
				}
			}
			this.packetQueue = [];
			this.game.update();
			await sleep(100);
		}
	}
}

export { GameServer, GameData, Player, Plant };