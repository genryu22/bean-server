import * as dgram from 'node:dgram';
import * as ipc from 'node-ipc';
import { ServerPacket } from './server_packet/server_packet';
const net = require('node:net');

type RawPacket = {
	data: object;
	ip: string;
	port: number;
}

interface Server {
	start(listener: (packet: object) => void): (packet: ServerPacket) => void;
	stop(): void;
}

class TCPServer implements Server {

	private clientSocket: any;

	private server: any;

	start(listener: (packet: object) => void): (packet: ServerPacket) => void {
		this.server = net.createServer((socket) => {
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

		this.server.listen(25565, "127.0.0.1");

		return (packet) => {
			if (this.clientSocket == null) {
				console.log('クライアント未接続');
				return;
			}
			this.clientSocket.write(JSON.stringify(packet) + '\n');
		}
	}

	stop(): void {
		this.server.close();
	}
}

export const createServer = (port: number): Server => {
	return new TCPServer();
	//return new WindowsSocketServer();
	//return new UDPServer(25565);
}