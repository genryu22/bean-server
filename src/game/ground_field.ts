import { fork } from "node:child_process";

type Position = {
	x: number;
	y: number;
}

type GroundTile = {
	water: number;
	fertility: number;
};

type Plant = {
	tiles: GroundTile[];
	growth: number;
	maxGrowth: number;
}

type GroundField = {
	plants: Plant[];
	tiles: (GroundTile & Position)[];
}

const MAX_WATER = 100;

const MAX_FERTILITY = 100;

const GROW_INTERVAL = 1000; // ミリ秒

const isGroundTile = (obj: object): obj is GroundTile => {
	return 'water' in obj && typeof (obj as GroundTile).water === 'number'
		&& 'fertility' in obj && typeof (obj as GroundTile).fertility === 'number'
}

function isArrayOfGroundTiles(value: unknown): value is GroundTile[] {
	return Array.isArray(value) && value.every(item => isGroundTile(item));
}

const isPlant = (obj: object): obj is Plant => {
	return 'growth' in obj && typeof (obj as Plant).growth === 'number'
		&& 'maxGrowth' in obj && typeof (obj as Plant).maxGrowth === 'number'
		&& 'tiles' in obj && isArrayOfGroundTiles((obj as Plant).tiles)
}

const isArrayOfPlants = (value: unknown): value is Plant[] => {
	return Array.isArray(value) && value.every(item => isPlant(item));
}

const isGroundField = (obj: object): obj is GroundField => {
	return 'plants' in obj && isArrayOfPlants(obj['plants'])
		&& 'tiles' in obj && isArrayOfGroundTiles(obj['plants']);
}

const createEmptyGroundField = (): GroundField => {
	const empty: GroundField = {
		plants: [],
		tiles: [],
	};

	for (let i = 0; i < 10; ++i) {
		for (let j = 0; j < 10; ++j) {
			expandGroundField(empty, { x: i, y: j });
		}
	}

	return empty;
}

const createEmptyTile = (): GroundTile => {
	const emptyTile: GroundTile = {
		water: 0,
		fertility: 0,
	};
	return emptyTile;
}

const expandGroundField = (groundField: GroundField, pos: Position): void => {
	if (findTiles(groundField, pos).length > 0) {
		return;
	} else {
		groundField.tiles = [...groundField.tiles, { ...createEmptyTile(), x: pos.x, y: pos.y }];
	}
}

const growGroundField = (groundField: GroundField, elapsed: number): void => {
	for (let i = 0; i < Math.floor(elapsed / GROW_INTERVAL); ++i) {
		growGroundFieldOnce(groundField);
	}
}

const growGroundFieldOnce = (groundField: GroundField): void => {
	groundField.plants
		.filter(p => p.growth < p.maxGrowth)
		.filter(p => p.tiles.every(t => t.water > 0 && t.fertility > 0))
		.forEach(p => {
			if (p.tiles.every(t => t.water > 0 && t.fertility > 0)) {
				p.growth += 1;
				for (let t of p.tiles) {
					t.water -= 1;
					t.fertility -= 1;
				}
			}
		})
}

const waterGroundField = (groundField: GroundField, pos: Position, water: number): void => {
	findTiles(groundField, pos).forEach(t => t.water = Math.max(t.water + water, MAX_WATER));
}

const fertilizeGroundField = (groundField: GroundField, pos: Position, fertility: number): void => {
	findTiles(groundField, pos).forEach(t => t.fertility = Math.max(t.fertility + fertility, MAX_FERTILITY));
}

const findTiles = (groundField: GroundField, pos: Position): GroundTile[] => {
	return groundField.tiles.filter(t => t.x == pos.x && t.y == pos.y);
}