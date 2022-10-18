import { Player } from "../game_server";
import { SERVER_OPCODE } from "./server_opcode";
import { ServerPacket } from "./server_packet";

const createPacketAll = (player: Player, allData: object): ServerPacket => {
	return {
		opcode: SERVER_OPCODE.All,
		ip: player.ip,
		port: player.port,
		data: allData,
	}
}

const createPacketAddPlayer = (existingPlayer: Player, newPlayer: Player): ServerPacket => {
	return {
		opcode: SERVER_OPCODE.AddPlayer,
		ip: existingPlayer.ip,
		port: existingPlayer.port,
		data: newPlayer,
	}
}

export { createPacketAll, createPacketAddPlayer };