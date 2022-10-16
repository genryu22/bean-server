type MasterLightningRod = {
	type: string,
	size: number,
};

export const isMasterLightningRod = (data: any): data is MasterLightningRod => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'size' in data && typeof data['size'] === 'number'
};