import {describe, it} from 'node:test';
import {ok} from 'node:assert';

import {
	fixtureMacho,
	hash,
	chunkedHashes,
	machoThin,
	fixtureMachos
} from '../util.spec.ts';
import {CodeDirectory} from './codedirectory.ts';
import {cdInfoSlot, cdRequirementsSlot, cdResourceDirSlot} from '../const.ts';

const emptyRequirements = Buffer.from(
	'fa de 0c 01 00 00 00 0c 00 00 00 00'.replaceAll(' ', ''),
	'hex'
);

async function addCodeHashes(cd: CodeDirectory, macho: Readonly<Uint8Array>) {
	const {pageSize} = cd;
	const hashes = await chunkedHashes(
		cd.hashType,
		macho,
		pageSize ? Math.pow(2, pageSize) : 0,
		0,
		cd.codeLimit
	);
	for (let i = hashes.length; i--; ) {
		cd.setSlot(i, false, hashes[i]);
	}
}

void describe('blob/codedirectory', () => {
	void describe('fixtures', () => {
		for (const {kind, arch, file, archs} of fixtureMachos()) {
			// Skip binaries with no signed architectures.
			if (![...archs.values()].filter(Boolean).length) {
				continue;
			}

			void it(`${kind}: ${arch}: ${file}`, async () => {
				let resources: string[] | null = null;
				const bundle = file.match(
					/^((.*\/)?([^./]+\.(app|framework)))\/([^.]+\/)[^/]+$/
				);
				if (bundle) {
					const [, path, , , ext] = bundle;
					resources =
						ext === 'framework'
							? [
									'Resources/Info.plist',
									'_CodeSignature/CodeResources'
								].map(s => `${path}/Versions/A/${s}`)
							: [
									'Info.plist',
									'_CodeSignature/CodeResources'
								].map(s => `${path}/Contents/${s}`);
				}

				const files = await fixtureMacho(kind, arch, [
					file,
					...(resources || [])
				]);
				const [macho] = files;
				const infoPlist = resources ? files[1] : null;
				const codeResources = resources ? files[2] : null;

				for (const [arc, info] of archs) {
					if (!info) {
						continue;
					}

					const thin = machoThin(macho, info.arch[0], info.arch[1]);

					const {requirements} = info;
					for (const hashType of info.hashes) {
						const cd = new CodeDirectory();
						cd.version = info.version;
						cd.flags = info.flags;
						cd.codeLimit = info.offset;
						cd.hashType = hashType;
						cd.pageSize = Math.log2(info.page);
						cd.execSegBase = BigInt(info.execsegbase);
						cd.execSegLimit = BigInt(info.execseglimit);
						cd.execSegFlags = BigInt(info.execsegflags);
						cd.identifier = info.identifier;
						cd.teamID = info.teamid;
						if (infoPlist) {
							cd.setSlot(
								-cdInfoSlot,
								false,
								// eslint-disable-next-line no-await-in-loop
								await hash(hashType, infoPlist)
							);
						}
						switch (requirements) {
							case '': {
								// No requirements.
								break;
							}
							case 'count=0 size=12': {
								cd.setSlot(
									-cdRequirementsSlot,
									false,
									// eslint-disable-next-line no-await-in-loop
									await hash(hashType, emptyRequirements)
								);
								break;
							}
							default: {
								throw new Error(
									`Unexpected requirements: ${requirements}`
								);
							}
						}
						if (codeResources) {
							cd.setSlot(
								-cdResourceDirSlot,
								false,
								// eslint-disable-next-line no-await-in-loop
								await hash(hashType, codeResources)
							);
						}
						// eslint-disable-next-line no-await-in-loop
						await addCodeHashes(cd, thin);

						const data = new Uint8Array(cd.byteLength);
						cd.byteWrite(data);
						ok(
							// eslint-disable-next-line unicorn/prefer-includes
							Buffer.from(thin).indexOf(
								Buffer.from(data),
								info.offset
							) >= 0,
							`CD: ${arc}: hashType=${hashType}`
						);
					}
				}
			});
		}
	});
});