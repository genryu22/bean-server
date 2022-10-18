import { readClientConnection } from './c_connection'
import { CLIENT_OPCODE } from './client_opcode'

type RawPacketData = {
	opcode: number;
	ip: string;
	port: number;
}

const isRawPacketData = (data: any): data is RawPacketData => {
	return 'opcode' in data && typeof (data['opcode']) === 'number'
		&& 'ip' in data && typeof (data['ip']) === 'string'
		&& 'port' in data && typeof (data['port']) === 'number'
}

export const readPacketData = (data: RawPacketData | object): object => {
	if (!isRawPacketData(data)) {
		return null;
	}

	const clientOpcode = data.opcode;
	switch (clientOpcode) {
		case CLIENT_OPCODE.Connect:
			return readClientConnection(data);
		case CLIENT_OPCODE.Disconnect:
		case CLIENT_OPCODE.Unknown:
		default:
			return null;
	}
}