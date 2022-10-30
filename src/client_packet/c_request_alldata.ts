type C_RequestAllData = {
	id: string;
}

const isClientRequestAllDataPacket = (data: object): data is C_RequestAllData => {
	return 'id' in data && typeof (data['id']) == 'string';
}

const readClientRequestAllData = (data: C_RequestAllData | object): C_RequestAllData | null => {
	if (isClientRequestAllDataPacket(data)) {
		return data;
	}
	return null;
}

export { isClientRequestAllDataPacket, readClientRequestAllData }