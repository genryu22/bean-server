type MasterTitle = {
	type: string,
	rarity: 'F' | 'N' | 'S' | 'S+',
	sell_price_factor: number,
	size_factor: number,
	max_growth_factor: number,
	weight_a_factor: number,
	weight_b_factor: number,
	weight_c_factor: number,
	max_harvest_count_factor: number,
	crop_factor: number,
	crop_count_factor: number,
	title_prob_factor: number,
};

const isMasterTitle = (data: any): data is MasterTitle => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'rarity' in data && (data['rarity'] == 'F' || data['rarity'] == 'N' || data['rarity'] == 'S' || data['rarity'] == 'S+')
		&& 'sell_price_factor' in data && typeof data['sell_price_factor'] === 'number'
		&& 'size_factor' in data && typeof data['size_factor'] === 'number'
		&& 'max_growth_factor' in data && typeof data['max_growth_factor'] === 'number'
		&& 'weight_a_factor' in data && typeof data['weight_a_factor'] === 'number'
		&& 'weight_b_factor' in data && typeof data['weight_b_factor'] === 'number'
		&& 'weight_c_factor' in data && typeof data['weight_c_factor'] === 'number'
		&& 'max_harvest_count_factor' in data && typeof data['max_harvest_count_factor'] === 'number'
		&& 'crop_factor' in data && typeof data['crop_factor'] === 'number'
		&& 'crop_count_factor' in data && typeof data['crop_count_factor'] === 'number'
		&& 'title_prob_factor' in data && typeof data['title_prob_factor'] === 'number'
};

export { MasterTitle, isMasterTitle };