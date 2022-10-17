type C_Connection = {
	name: string;
	ip: string;
	port: number;
}

const isClientConnectionPacket = (data: object): data is C_Connection => {
	return 'name' in data && typeof (data['name']) == 'string'
		&& 'ip' in data && typeof (data['ip']) == 'string'
		&& 'port' in data && typeof (data['port']) == 'number';
}

const readClientConnection = (data: C_Connection | object): C_Connection | null => {
	if (isClientConnectionPacket(data)) {
		return data;
	}
	return null;
}

export { isClientConnectionPacket, readClientConnection }