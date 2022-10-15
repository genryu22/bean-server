import { readClientConnection } from './c_connection'
import { CLIENT_OPCODE } from './client_opcode'

type RawPacketData = {
	opcode: number;
}

export const readPacketData = (data: RawPacketData | object): object => {
	if (!('opcode' in data && typeof (data['opcode']) === 'number')) {
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