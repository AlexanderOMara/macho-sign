/* eslint-disable max-classes-per-file */
import {Struct, structT, structU32} from '../struct.ts';
import {LcStr, LcStrBE, LcStrLE} from './lcstr.ts';

/**
 * Fixed virtual memory shared library.
 */
export class Fvmlib extends Struct {
	public declare readonly ['constructor']: typeof Fvmlib;

	/**
	 * Target pathname.
	 */
	public declare readonly name: this['constructor']['LcStr']['prototype'];

	/**
	 * Minor version.
	 */
	public declare minorVersion: number;

	/**
	 * Header address.
	 */
	public declare headerAddr: number;

	/**
	 * LcStr reference.
	 */
	public static readonly LcStr = LcStr;

	/**
	 * @inheritdoc
	 */
	public static readonly BYTE_LENGTH = (o => {
		o += structT(this, o, 'name', 'LcStr');
		o += structU32(this, o, 'minorVersion');
		o += structU32(this, o, 'headerAddr');
		return o;
	})(super.BYTE_LENGTH);
}

/**
 * Fixed virtual memory shared library, big endian.
 */
export class FvmlibBE extends Fvmlib {
	public declare readonly ['constructor']: typeof FvmlibBE;

	/**
	 * @inheritdoc
	 */
	public static readonly LITTLE_ENDIAN = false;

	/**
	 * @inheritdoc
	 */
	public static readonly LcStr = LcStrBE;
}

/**
 * Fixed virtual memory shared library, little endian.
 */
export class FvmlibLE extends Fvmlib {
	public declare readonly ['constructor']: typeof FvmlibLE;

	/**
	 * @inheritdoc
	 */
	public static readonly LITTLE_ENDIAN = true;

	/**
	 * @inheritdoc
	 */
	public static readonly LcStr = LcStrLE;
}
