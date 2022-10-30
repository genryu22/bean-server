type ServerPacket = {
	opcode: number,
	id: string,
	data: object,
};

const isServerPacket = (value: any): value is ServerPacket => {
	return 'opcode' in value && typeof value['opcode'] === 'number'
		&& 'id' in value && typeof value['id'] === 'string'
		&& 'data' in value && typeof value['data'] === 'object'
}

export { ServerPacket, isServerPacket }