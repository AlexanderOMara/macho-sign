import {describe, it} from 'node:test';
import {deepStrictEqual, strictEqual} from 'node:assert';

import {unhex} from '../util.spec.ts';
import {kSecCodeMagicEntitlementDER} from '../const.ts';

import {EntitlementDERBlob} from './entitlementderblob.ts';

void describe('EntitlementDERBlob', () => {
	void it('BYTE_LENGTH', () => {
		strictEqual(EntitlementDERBlob.BYTE_LENGTH, 8);
	});

	void it('empty (invalid?)', () => {
		const {BYTE_LENGTH} = EntitlementDERBlob;
		const buffer = new ArrayBuffer(BYTE_LENGTH);
		const edb = new EntitlementDERBlob(buffer);
		edb.initialize2(BYTE_LENGTH);
		deepStrictEqual(
			new Uint8Array(buffer),
			unhex('FA DE 71 72 00 00 00 08')
		);
	});

	void it('data', () => {
		const data = unhex('01 02 03 04 05 06 07 08 F0 F1 F2 F3 F4 F5 F6 F7');
		const edb = new EntitlementDERBlob(
			EntitlementDERBlob.blobify(data).buffer
		);
		const dv = new DataView(edb.buffer, edb.byteOffset, edb.length);
		strictEqual(dv.getUint32(0), kSecCodeMagicEntitlementDER);
		strictEqual(dv.getUint32(4), edb.length);
		deepStrictEqual(
			new Uint8Array(edb.der.buffer, edb.der.byteOffset, edb.derLength),
			data
		);
	});
});
