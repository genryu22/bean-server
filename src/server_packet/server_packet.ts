type ServerPacket = {
	opcode: number,
	ip: string,
	port: number,
	data: object,
};

const isServerPacket = (value: any): value is ServerPacket => {
	return 'opcode' in value && typeof value['opcode'] === 'number'
		&& 'ip' in value && typeof value['ip'] === 'string'
		&& 'port' in value && typeof value['port'] === 'number'
		&& 'data' in value && typeof value['data'] === 'object'
}

export { ServerPacket, isServerPacket }