type MasterSeed = {
	item_type: string,
	plant_type: string,
};

export const isMasterSeed = (data: any): data is MasterSeed => {
	return 'item_type' in data && typeof data['item_type'] === 'string'
		&& 'plant_type' in data && typeof data['plant_type'] === 'string'
};