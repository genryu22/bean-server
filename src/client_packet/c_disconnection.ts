type C_Disconnection = {
	id: string;
}

const isClientDisconnectionPacket = (data: object): data is C_Disconnection => {
	return 'id' in data && typeof (data['id']) == 'string';
}

const readClientDisconnection = (data: C_Disconnection | object): C_Disconnection | null => {
	if (isClientDisconnectionPacket(data)) {
		return data;
	}
	return null;
}

export { isClientDisconnectionPacket, readClientDisconnection }