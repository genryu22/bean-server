type C_RequestAllData = {
	ip: string;
	port: number;
}

const isClientRequestAllDataPacket = (data: object): data is C_RequestAllData => {
	return 'ip' in data && typeof (data['ip']) == 'string'
		&& 'port' in data && typeof (data['port']) == 'number';
}

const readClientRequestAllData = (data: C_RequestAllData | object): C_RequestAllData | null => {
	if (isClientRequestAllDataPacket(data)) {
		return data;
	}
	return null;
}

export { isClientRequestAllDataPacket, readClientRequestAllData }