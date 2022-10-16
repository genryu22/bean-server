import { parse } from 'csv-parse';
import * as fs from 'node:fs/promises';
const path = require('node:path');

const parseCsv = (csv: string): Promise<object[]> => {
	return new Promise((resolve, reject) => {
		parse(csv, {
			delimiter: ',',
			columns: true,
			cast: (value, context) => {
				const n = Number(value);
				if (Number.isNaN(n)) {
					return value;
				} else {
					return n;
				}
			},
		}, function (err, records) {
			if (err) {
				reject();
			} else {
				resolve(records);
			}
		});
	})
}

export const readMasterData = async (): Promise<object[][]> => {
	try {
		const csvFiles = (await fs.readdir('./master_csv', { withFileTypes: true }))
			.filter(f => f.isFile && /.*\.(csv)$/.test(f.name))
		const res = await Promise.all(csvFiles.map(file => fs.readFile('./master_csv/' + file.name, { encoding: 'utf8' }).then(parseCsv)))
		return res;
	} catch (err) {
		throw err;
	}
}