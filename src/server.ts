import * as dgram from 'node:dgram';

type RawPacket = {
	data: object;
	ip: string;
	port: number;
}

interface Server {
	start(listener: (rawPacket: RawPacket) => void): (packet: object, ip: string, port: number) => void;
	stop(): void;
}

class UDPServer implements Server {

	private socket: dgram.Socket;

	private port: number;

	constructor(port: number) {
		this.port = port;
	}

	start(listener: (rawPacket: RawPacket) => void): (packet: object, ip: string, port: number) => void {
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

		return (packet, ip, port) => {
			const json_packet = JSON.stringify(packet);
			this.socket.send(json_packet, port, ip, (error, bytes) => {
				if (error) {
					console.log(error.message);
					console.log(`failed to send packet to ${ip}:${port}. ${json_packet.length}`);
				}
			});
		};
	}

	stop() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}

export const createServer = (port: number): Server => {
	return new UDPServer(25565);
}