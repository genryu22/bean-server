type MasterGacha = {
	type: string,
	item_type: string,
};

export const isMasterGacha = (data: any): data is MasterGacha => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'item_type' in data && typeof data['item_type'] === 'string'
};