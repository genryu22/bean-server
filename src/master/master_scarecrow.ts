type MasterScarecrow = {
	type: string,
	size: number,
};

export const isMasterScarecrow = (data: any): data is MasterScarecrow => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'size' in data && typeof data['size'] === 'number'
};