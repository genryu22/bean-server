import * as dgram from 'node:dgram';

type RawPacket = {
	data: object;
	ip: string;
	port: number;
}

export class Server {

	private socket: dgram.Socket;

	private port: number;

	constructor(port: number) {
		this.port = port;
	}

	start(listener: (rawPacket: RawPacket) => void) {
		if (this.socket != null) {
			this.socket.close();
		}

		this.socket = dgram.createSocket('udp4');

		this.socket.on('error', (err) => {
			console.log(`server error:\n${err.stack}`);
			this.socket.close();
		});

		this.socket.on('listening', () => {
			const address = this.socket.address();
			console.log(`server listening ${address.address}:${address.port}`);
		});

		this.socket.on('message', (msg, rinfo) => {
			try {
				listener({ data: JSON.parse(msg.toString('utf8')), ip: rinfo.address, port: rinfo.port });
			} catch (e) {
				console.log(`error!! server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
			}
		});

		this.socket.bind(this.port);
	}

	stop() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}