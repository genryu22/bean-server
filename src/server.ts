import * as dgram from 'node:dgram';
import * as ipc from 'node-ipc';
const net = require('node:net');

type RawPacket = {
	data: object;
	ip: string;
	port: number;
}

interface Server {
	start(listener: (packet: object) => void): (packet: object, ip: string, port: number) => void;
	stop(): void;
}

class UDPServer implements Server {

	private socket: dgram.Socket;

	private port: number;

	constructor(port: number) {
		this.port = port;
	}

	start(listener: (packet: object) => void): (packet: object, ip: string, port: number) => void {
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

class WindowsSocketServer implements Server {

	private clientSocket: object;

	start(listener: (packet: object) => void): (packet: object, ip: string, port: number) => void {
		const self_server = this;

		ipc.config.id = 'bean-server';
		ipc.config.retry = 1500;
		ipc.serve(
			function () {
				ipc.server.on(
					'connect',
					function (socket) {
						self_server.clientSocket = socket;
					}
				);

				ipc.server.on(
					'bean.packet',
					function (data, socket) {
						listener(JSON.parse(data.toString('utf8')));
					}
				);
			}
		);

		ipc.server.start();

		return (packet, ip, port) => {
			if (this.clientSocket == null) {
				console.log('クライアント未接続');
				return;
			}
			ipc.server.emit(
				this.clientSocket,
				'bean.packet',
				JSON.stringify({ ...packet, ip, port })
			);
		}
	}

	stop(): void {
		ipc.server.stop();
	}
}

class TCPServer implements Server {

	private clientSocket: any;

	start(listener: (packet: object) => void): (packet: object, ip: string, port: number) => void {
		const server = net.createServer((socket) => {
			console.log('unity client connected.');
			this.clientSocket = socket;
			socket.on('data', function (data) {
				try {
					const parsed = JSON.parse(data.toString('utf8'));
					listener(parsed);
				} catch {
					console.log('unityクライアントから不適切なパケット受信' + data);
				}
			});
			socket.on('close', function (hadError) {
				this.clientSocket = null;
				console.log('unity client disconnected.');
			})
			socket.on('error', function (err) {
				console.log(err);
				this.clientSocket = null;
			})
		});

		server.listen(25565, "127.0.0.1");

		return (packet, ip, port) => {
			if (this.clientSocket == null) {
				console.log('クライアント未接続');
				return;
			}
			this.clientSocket.write(JSON.stringify({ ...packet, ip, port }));
		}
	}

	stop(): void {
	}
}

export const createServer = (port: number): Server => {
	return new TCPServer();
	//return new WindowsSocketServer();
	//return new UDPServer(25565);
}