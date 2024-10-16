import {readFileSync} from 'node:fs';
import {open} from 'node:fs/promises';
import {subtle} from 'node:crypto';

import type {BufferView} from './type.ts';
import {
	CPU_SUBTYPE_POWERPC_7400,
	CPU_SUBTYPE_POWERPC_970,
	CPU_SUBTYPE_POWERPC_ALL,
	CPU_TYPE_ARM64,
	CPU_TYPE_I386,
	CPU_TYPE_POWERPC,
	CPU_TYPE_POWERPC64,
	CPU_TYPE_X86_64,
	FAT_CIGAM,
	FAT_CIGAM_64,
	FAT_MAGIC,
	FAT_MAGIC_64,
	kSecCodeSignatureHashSHA1,
	kSecCodeSignatureHashSHA256,
	kSecCodeSignatureHashSHA256Truncated,
	kSecCodeSignatureHashSHA384,
	kSecCodeSignatureHashSHA512,
	MH_CIGAM,
	MH_CIGAM_64,
	MH_MAGIC,
	MH_MAGIC_64
} from './const.ts';

export function indexOf(
	haystack: Readonly<Uint8Array>,
	needle: Readonly<Uint8Array>,
	offset = 0
) {
	const l = needle.length;
	OUTER: for (const e = haystack.length - l; offset <= e; offset++) {
		offset = haystack.indexOf(needle[0], offset);
		if (offset < 0) {
			break;
		}
		for (let i = 1; i < l; i++) {
			if (haystack[offset + i] !== needle[i]) {
				continue OUTER;
			}
		}
		return offset;
	}
	return -1;
}

export function unhex(...hex: string[]) {
	return new Uint8Array(
		hex
			.join('')
			.replace(/\s+/g, '')
			.match(/.{1,2}/g)!
			.map(x => +`0x${x}`)
	);
}

export async function hash(hashType: number, data: Readonly<BufferView>) {
	let limit = -1;
	let algo = '';
	switch (hashType) {
		case kSecCodeSignatureHashSHA1: {
			algo = 'SHA-1';
			break;
		}
		case kSecCodeSignatureHashSHA256Truncated: {
			limit = 20;
			// Fallthrough.
		}
		case kSecCodeSignatureHashSHA256: {
			algo = 'SHA-256';
			break;
		}
		case kSecCodeSignatureHashSHA384: {
			algo = 'SHA-384';
			break;
		}
		case kSecCodeSignatureHashSHA512: {
			algo = 'SHA-512';
			break;
		}
		default: {
			throw new Error(`Unknown hash type: ${hashType}`);
		}
	}
	const h = await subtle.digest(algo, data);
	return new Uint8Array(limit < 0 ? h : h.slice(0, limit));
}

export async function chunkedHashes(
	hashType: number,
	data: Readonly<BufferView>,
	chunk: number,
	offset = 0,
	length = -1
) {
	const d = new Uint8Array(data.buffer, data.byteOffset + offset, length);
	const l = d.length;
	chunk = chunk || l;
	const slices = [];
	for (let i = 0; i < l; i += chunk) {
		slices.push(d.subarray(i, Math.min(i + chunk, l)));
	}
	return Promise.all(slices.map(async d => hash(hashType, d)));
}

async function inflate(data: Readonly<Uint8Array>, size: number, crc: number) {
	const d = new Uint8Array(size);
	const r: ReadableStreamDefaultReader<Uint8Array> =
		new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(
					new Uint8Array([31, 139, 8, 0, 0, 0, 0, 0, 0, 0])
				);
				controller.enqueue(data);
				const tail = new ArrayBuffer(8);
				const view = new DataView(tail);
				view.setUint32(0, crc, true);
				view.setUint32(4, size, true);
				controller.enqueue(new Uint8Array(tail));
				controller.close();
			}
		})
			.pipeThrough(new DecompressionStream('gzip'))
			.getReader();
	let i = 0;
	for (;;) {
		// eslint-disable-next-line no-await-in-loop
		const {done, value} = await r.read();
		if (done) {
			break;
		}
		d.set(value, i);
		i += value.length;
	}
	return d;
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
			const crc = dirData.readUint32LE(i);
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
					let inflater: typeof inflate | null;
					switch (compression) {
						case 0: {
							inflater = null;
							break;
						}
						case 8: {
							inflater = inflate;
							break;
						}
						default: {
							throw new Error(
								`Unknown compression type: ${compression}`
							);
						}
					}

					if (!uSize) {
						return new Uint8Array();
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

					const cData = new Uint8Array(cSize);
					await f.read(cData, 0, cSize, headerOffset + i);
					return inflater ? inflater(cData, uSize, crc) : cData;
				}
			] as const;
		}
	} finally {
		await f.close();
	}
}

export interface FixtureMachoSignatureInfo {
	arch: [number, number | null];
	offset: number;
	version: number;
	flags: number;
	identifier: string;
	teamid: string;
	hashes: number[];
	page: number;
	requirements: string;
	execsegbase: number;
	execseglimit: number;
	execsegflags: number;
}

function fixtureMachosRead() {
	const hashTypes: {[key: string]: number} = {
		sha1: kSecCodeSignatureHashSHA1,
		sha256: kSecCodeSignatureHashSHA256,
		sha384: kSecCodeSignatureHashSHA384,
		sha512: kSecCodeSignatureHashSHA512
	};
	const cpus: {[key: string]: [number, number | null]} = {
		arm64: [CPU_TYPE_ARM64, null],
		x86_64: [CPU_TYPE_X86_64, null],
		i386: [CPU_TYPE_I386, null],
		ppc64: [CPU_TYPE_POWERPC64, null],
		ppc7400: [CPU_TYPE_POWERPC, CPU_SUBTYPE_POWERPC_7400],
		ppc970: [CPU_TYPE_POWERPC, CPU_SUBTYPE_POWERPC_970],
		ppc: [CPU_TYPE_POWERPC, CPU_SUBTYPE_POWERPC_ALL]
	};
	const lines = readFileSync('spec/fixtures/macho.txt', 'utf8').split('\n');
	const all = new Map<
		string,
		Map<string, FixtureMachoSignatureInfo | null>
	>();
	let group = null;
	let arch = null;
	while (lines.length) {
		const line = lines.shift()!;
		if (!line) {
			continue;
		}
		const mg = line.match(/^(\t*)([^\t].*):$/);
		if (mg) {
			const indent = mg[1].length;
			switch (indent) {
				case 0: {
					[, , group] = mg;
					arch = null;
					all.set(mg[2], new Map());
					break;
				}
				case 1: {
					[, , arch] = mg;
					const a = group ? all.get(group) : null;
					if (!a) {
						throw new Error(`Bad line: ${line}`);
					}
					a.set(arch, null);
					break;
				}
				default: {
					throw new Error(`Bad line: ${line}`);
				}
			}
			continue;
		}
		const mv = line.match(/^\t\t([^=]+)=(.*)$/);
		if (!mv || !group || !arch) {
			throw new Error(`Bad line: ${line}`);
		}
		const [, k, v] = mv;
		const a = all.get(group)!.get(arch)! || {
			arch: cpus[arch] ?? [0, null],
			offset: 0,
			version: 0,
			flags: 0,
			identifier: '',
			teamid: '',
			hashes: [],
			page: 0,
			execsegbase: 0,
			execseglimit: 0,
			execsegflags: 0
		};
		switch (k) {
			case 'offset':
			case 'version':
			case 'flags':
			case 'page':
			case 'execsegbase':
			case 'execseglimit':
			case 'execsegflags': {
				a[k] = +v || 0;
				break;
			}
			case 'identifier':
			case 'teamid':
			case 'requirements': {
				a[k] = v;
				break;
			}
			case 'hashes': {
				a[k] = v
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
					.map(s => hashTypes[s] ?? 0);
				break;
			}
			default: {
				throw new Error(`Bad line: ${line}`);
			}
		}
		all.get(group)!.set(arch, a);
	}
	const r = [];
	for (const [g, a] of all) {
		const [, kind, , arch, ...parts] = g.split('/');
		r.push({
			kind,
			arch,
			file: parts.join('/'),
			archs: a as Readonly<
				Map<string, Readonly<FixtureMachoSignatureInfo>>
			>
		});
	}
	return r;
}

let staticFixtureMachos: ReturnType<typeof fixtureMachosRead> | null = null;

export function fixtureMachos() {
	staticFixtureMachos ??= fixtureMachosRead();
	return staticFixtureMachos;
}

export async function fixtureMacho(
	kind: string,
	arch: string,
	files: readonly string[]
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

export async function readMachoFiles(kind: string, arch: string, file: string) {
	let resources: string[] | null = null;
	const bundle = file.match(
		/^((.*\/)?([^./]+\.(app|framework)))\/([^.]+\/)[^/]+$/
	);
	if (bundle) {
		const [, path, , , ext] = bundle;
		resources =
			ext === 'framework'
				? [
						`${path}/Versions/A/Resources/Info.plist`,
						`${path}/Versions/A/_CodeSignature/CodeResources`
					]
				: [
						`${path}/Contents/Info.plist`,
						`${path}/Contents/_CodeSignature/CodeResources`
					];
	}
	const files = await fixtureMacho(kind, arch, [file, ...(resources || [])]);
	const [macho] = files;
	const infoPlist = resources ? files[1] : null;
	const codeResources = resources ? files[2] : null;
	return {
		macho,
		infoPlist,
		codeResources
	};
}

export function machoThin(
	data: Readonly<BufferView>,
	type: number,
	subtype: number | null = null
) {
	const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
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
		return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
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
	if (slices.length !== 1) {
		throw new Error(`Matching archs: ${slices.length}`);
	}
	const [[offset, size]] = slices;
	return new Uint8Array(data.buffer, data.byteOffset + offset, size);
}
