type MasterPlant = {
	type: string,
	size: number,
	max_growth: number,
	weight_a: number,
	weight_b: number,
	weight_c: number,
	max_harvest_count: number,
	crop: string,
	crop_count: number,
	title_prob: number,
};

const isMasterPlant = (data: any): data is MasterPlant => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'size' in data && typeof data['size'] === 'number'
		&& 'max_growth' in data && typeof data['max_growth'] === 'number'
		&& 'weight_a' in data && typeof data['weight_a'] === 'number'
		&& 'weight_b' in data && typeof data['weight_b'] === 'number'
		&& 'weight_c' in data && typeof data['weight_c'] === 'number'
		&& 'max_harvest_count' in data && typeof data['max_harvest_count'] === 'number'
		&& 'crop' in data && typeof data['crop'] === 'string'
		&& 'crop_count' in data && typeof data['crop_count'] === 'number'
		&& 'title_prob' in data && typeof data['title_prob'] === 'number'
};

export { MasterPlant, isMasterPlant }