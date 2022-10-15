type C_Connection = {
	name: string;
}

const isClientConnectionPacket = (data: object): data is C_Connection => {
	return 'name' in data && typeof (data['name']) == 'string';
}

const readClientConnection = (data: C_Connection | object): C_Connection | null => {
	if (isClientConnectionPacket(data)) {
		return data;
	}
	return null;
}

export { isClientConnectionPacket, readClientConnection }