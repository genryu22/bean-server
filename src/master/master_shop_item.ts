type MasterShopItem = {
	item_type: string,
	always: boolean,
};

const isMasterShopItem = (data: any): data is MasterShopItem => {
	return 'item_type' in data && typeof data['item_type'] === 'string'
		&& 'always' in data && typeof data['always'] === 'boolean'
};

export { isMasterShopItem, MasterShopItem }