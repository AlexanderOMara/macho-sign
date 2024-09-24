import {describe, it} from 'node:test';
import {deepStrictEqual, strictEqual} from 'node:assert';

import {viewData, viewUint8} from './util.ts';
import {unhex} from './util.spec.ts';
import {CSMAGIC_BLOBWRAPPER} from './const.ts';
import {BlobWrapper} from './blobwrapper.ts';

void describe('blobwrapper', () => {
	void it('empty', () => {
		const bw = new BlobWrapper();
		bw.initialize(BlobWrapper.sizeof);
		deepStrictEqual(viewUint8(bw), unhex('FA DE 0B 01 00 00 00 08'));
	});

	void it('data', () => {
		const data = unhex('09 AB CD EF 01 02 03 04 05 06 07 08 09 0A 0B 0C');
		const bw = BlobWrapper.blobify(data);
		const dv = viewData(bw);
		strictEqual(dv.getUint32(0), CSMAGIC_BLOBWRAPPER);
		strictEqual(dv.getUint32(4), bw.byteLength);
		deepStrictEqual(viewUint8(dv, 8), data);
	});

	void it('data', () => {
		const data = unhex('09 AB CD EF 01 02 03 04 05 06 07 08 09 0A 0B 0C');
		const bw = BlobWrapper.alloc(data.length);
		viewUint8(bw.data).set(data);
		const dv = viewData(bw);
		strictEqual(dv.getUint32(0), CSMAGIC_BLOBWRAPPER);
		strictEqual(dv.getUint32(4), bw.byteLength);
		deepStrictEqual(viewUint8(dv, 8), data);
	});
});
