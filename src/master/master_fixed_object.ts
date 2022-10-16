type MasterFixedObject = {
	readonly type: string,
	readonly item_type: string
};

export const isMasterFixedObject = (data: any): data is MasterFixedObject => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'item_type' in data && typeof data['item_type'] === 'string'
};