type MasterItem = {
	type: string,
	category: string,
	sell_price: number,
	buy_price: number,
	gacha_a: boolean,
	gacha_b: boolean,
	gacha_c: boolean,
};

export const isMasterItem = (data: any): data is MasterItem => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'category' in data && typeof data['category'] === 'string'
		&& 'sell_price' in data && typeof data['sell_price'] === 'number'
		&& 'buy_price' in data && typeof data['buy_price'] === 'number'
		&& 'gacha_a' in data && typeof data['gacha_a'] === 'boolean'
		&& 'gacha_b' in data && typeof data['gacha_b'] === 'boolean'
		&& 'gacha_c' in data && typeof data['gacha_c'] === 'boolean'
};