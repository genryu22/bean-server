import { readClientConnection } from './c_connection'
import { CLIENT_OPCODE } from './client_opcode'
import { readClientRequestAllData } from './c_request_alldata';
import { readClientDisconnection } from './c_disconnection';

type RawPacketData = {
	opcode: number;
	id: string;
}

const isRawPacketData = (data: any): data is RawPacketData => {
	return 'opcode' in data && typeof (data['opcode']) === 'number'
		&& 'id' in data && typeof (data['id']) === 'string'
}

export const readPacketData = (data: RawPacketData | object): object => {
	if (!isRawPacketData(data)) {
		return null;
	}

	const clientOpcode = data.opcode;
	switch (clientOpcode) {
		case CLIENT_OPCODE.Connect:
			return readClientConnection(data);
		case CLIENT_OPCODE.RequestAllData:
			return readClientRequestAllData(data);
		case CLIENT_OPCODE.Disconnect:
			return readClientDisconnection(data);
		case CLIENT_OPCODE.Unknown:
		default:
			return null;
	}
}