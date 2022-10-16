type MasterEvent = {
	readonly type: string,
	readonly length_type: "const" | "random",
	readonly length: number;
};

const isMasterEvent = (data: any): data is MasterEvent => {
	return 'type' in data && typeof data['type'] === 'string'
		&& 'length_type' in data && (data['length_type'] === 'const' || data['length_type'] === 'random')
		&& 'length' in data && typeof data['length'] === 'number';
};

export { MasterEvent, isMasterEvent }