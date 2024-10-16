/* eslint-disable max-classes-per-file */
import {Struct, structI32, structU32, structU64} from '../struct.ts';

/**
 * Fat architecture, 64-bit.
 */
export class FatArch64 extends Struct {
	public declare readonly ['constructor']: typeof FatArch64;

	/**
	 * CPU type.
	 */
	public declare cputype: number;

	/**
	 * Machine type.
	 */
	public declare cpusubtype: number;

	/**
	 * File offset.
	 */
	public declare offset: bigint;

	/**
	 * Byte length.
	 */
	public declare size: bigint;

	/**
	 * Alignment as a power of 2.
	 */
	public declare align: number;

	/**
	 * Reserved.
	 */
	public declare reserved: number;

	/**
	 * @inheritdoc
	 */
	public static readonly BYTE_LENGTH = (o => {
		o += structI32(this, o, 'cputype');
		o += structI32(this, o, 'cpusubtype');
		o += structU64(this, o, 'offset');
		o += structU64(this, o, 'size');
		o += structU32(this, o, 'align');
		o += structU32(this, o, 'reserved');
		return o;
	})(super.BYTE_LENGTH);
}

/**
 * Fat architecture, 64-bit, big endian.
 */
export class FatArch64BE extends FatArch64 {
	public declare readonly ['constructor']: typeof FatArch64BE;

	/**
	 * @inheritdoc
	 */
	public static readonly LITTLE_ENDIAN = false;
}

/**
 * Fat architecture, 64-bit, little endian.
 */
export class FatArch64LE extends FatArch64 {
	public declare readonly ['constructor']: typeof FatArch64LE;

	/**
	 * @inheritdoc
	 */
	public static readonly LITTLE_ENDIAN = true;
}
