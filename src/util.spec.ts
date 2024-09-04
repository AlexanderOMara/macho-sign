import {open} from 'node:fs/promises';
import {inflateRaw} from 'node:zlib';

import {BufferView} from './type.ts';
import {
	FAT_CIGAM,
	FAT_CIGAM_64,
	FAT_MAGIC,
	FAT_MAGIC_64,
	MH_CIGAM,
	MH_CIGAM_64,
	MH_MAGIC,
	MH_MAGIC_64
} from './const.ts';
import {subview} from './util.ts';

async function zlibInflateRaw(data: Buffer) {
	return new Promise<Buffer>((resolve, reject) => {
		inflateRaw(data, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
}

export async function* zipped(file: string) {
	const f = await open(file, 'r');
	try {
		const {size} = await f.stat();
		const tail = Buffer.alloc(22);
		await f.read(tail, 0, 22, size - 22);
		const dirSize = tail.readUInt32LE(12);
		const dirOffset = tail.readUInt32LE(16);
		const dirData = Buffer.alloc(dirSize);
		await f.read(dirData, 0, dirSize, dirOffset);
		for (let i = 0; i < dirSize; ) {
			i += 4;
			i += 2;
			i += 2;
			i += 2;
			const compression = dirData.readUint16LE(i);
			i += 2;
			i += 2;
			i += 2;
			i += 4;
			const cSize = dirData.readUint32LE(i);
			i += 4;
			const uSize = dirData.readUint32LE(i);
			i += 4;
			const nameSize = dirData.readUint16LE(i);
			i += 2;
			const extraSize = dirData.readUint16LE(i);
			i += 2;
			const commentSize = dirData.readUint16LE(i);
			i += 2;
			i += 2;
			i += 2;
			i += 4;
			const headerOffset = dirData.readUint32LE(i);
			i += 4;
			const name = dirData.toString('utf8', i, i + nameSize);
			i += nameSize;
			i += extraSize;
			i += commentSize;

			yield [
				name,
				async () => {
					let inflater: ((data: Buffer) => Promise<Buffer>) | null;
					switch (compression) {
						case 0: {
							inflater = null;
							break;
						}
						case 8: {
							inflater = zlibInflateRaw;
							break;
						}
						default: {
							throw new Error(
								`Unknown compression type: ${compression}`
							);
						}
					}

					if (!uSize) {
						return new Uint8Array(0);
					}

					const header = Buffer.alloc(30);
					await f.read(header, 0, 30, headerOffset);
					let i = 0;
					i += 4;
					i += 2;
					i += 2;
					i += 2;
					i += 2;
					i += 2;
					i += 4;
					i += 4;
					i += 4;
					const fileNameSize = header.readUint16LE(i);
					i += 2;
					const extraSize = header.readUint16LE(i);
					i += 2;
					i += fileNameSize;
					i += extraSize;

					const cData = Buffer.alloc(cSize);
					await f.read(cData, 0, cSize, headerOffset + i);
					if (!inflater) {
						return new Uint8Array(
							cData.buffer,
							cData.byteOffset,
							cData.byteLength
						);
					}

					const uData = await inflater(cData);
					const {length} = uData;
					if (length !== uSize) {
						throw new Error(
							`Bad decompressed size: ${length} != ${uSize}`
						);
					}
					return new Uint8Array(
						uData.buffer,
						uData.byteOffset,
						uData.byteLength
					);
				}
			] as const;
		}
	} finally {
		await f.close();
	}
}

export async function fixtureMacho(
	kind: string,
	arch: string,
	files: string[]
) {
	const m = new Map(files.map((name, i) => [name, i]));
	const datas: Uint8Array[] = [];
	for await (const [name, read] of zipped(
		`spec/fixtures/macho/${kind}/dist/${arch}.zip`
	)) {
		const i = m.get(name) ?? -1;
		if (i < 0) {
			continue;
		}
		datas[i] = await read();
		m.delete(name);
	}
	if (m.size) {
		throw new Error(`Missing files: ${[...m.keys()].join(' ')}`);
	}
	return datas;
}

export function machoArch(
	data: BufferView,
	type: number,
	subtype: number | null = null
) {
	const v = subview(DataView, data);
	const magic = v.getUint32(0);
	let f = false;
	let b = false;
	let e = false;
	switch (magic) {
		case MH_MAGIC: {
			break;
		}
		case MH_MAGIC_64: {
			b = true;
			break;
		}
		case MH_CIGAM: {
			e = true;
			break;
		}
		case MH_CIGAM_64: {
			e = true;
			b = true;
			break;
		}
		case FAT_MAGIC: {
			f = true;
			break;
		}
		case FAT_MAGIC_64: {
			f = true;
			b = true;
			break;
		}
		case FAT_CIGAM: {
			f = true;
			e = true;
			break;
		}
		case FAT_CIGAM_64: {
			f = true;
			e = true;
			b = true;
			break;
		}
		default: {
			throw new Error(`Unknown magic: ${magic}`);
		}
	}
	if (!f) {
		const cputype = v.getInt32(4, e);
		const cpusubtype = v.getInt32(8, e);
		if (cputype !== type || (subtype && cpusubtype !== subtype)) {
			throw new Error(`Wrong arch: ${cputype} ${cpusubtype}`);
		}
		return subview(Uint8Array, v);
	}
	const count = v.getUint32(4, b);
	const slices: [number, number][] = [];
	let o = 8;
	for (let i = 0; i < count; i++) {
		const cputype = v.getInt32(o, e);
		o += 4;
		const cpusubtype = v.getInt32(o, e);
		o += 4;
		const offset = b ? Number(v.getBigUint64(o, e)) : v.getUint32(o, e);
		o += b ? 8 : 4;
		const size = b ? Number(v.getBigUint64(o, e)) : v.getUint32(o, e);
		o += b ? 8 : 4;
		// Ignore align:
		o += 4;
		if (cputype === type && (subtype === null || cpusubtype === subtype)) {
			slices.push([offset, size]);
		}
	}
	if (slices.length < 1) {
		throw new Error('No matching arch');
	}
	if (slices.length > 1) {
		throw new Error('Multiple matching archs');
	}
	const [[offset, size]] = slices;
	return subview(Uint8Array, data, offset, size);
}
