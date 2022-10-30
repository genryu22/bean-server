import { GameData, Plant, Player } from "../game_server";
import { SERVER_OPCODE } from "./server_opcode";
import { ServerPacket } from "./server_packet";

const createPacketAll = (player: Player, allData: GameData): ServerPacket => {
	return {
		opcode: SERVER_OPCODE.All,
		id: player.id,
		data: allData,
	}
}

const createPacketAddPlayer = (existingPlayer: Player, newPlayer: Player): ServerPacket => {
	return {
		opcode: SERVER_OPCODE.AddPlayer,
		id: existingPlayer.id,
		data: newPlayer,
	}
}

const createPacketAllPlants = (player: Player, plants: Plant[]): ServerPacket => {
	return {
		opcode: SERVER_OPCODE.AllPlants,
		id: player.id,
		data: plants,
	}
}

export { createPacketAll, createPacketAddPlayer, createPacketAllPlants };