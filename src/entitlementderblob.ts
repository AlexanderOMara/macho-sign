import {Blob} from './blob.ts';
import {kSecCodeMagicEntitlementDER} from './const.ts';
import {subview} from './util.ts';

/**
 * Entitlement DER Blob.
 */
export class EntitlementDERBlob extends Blob {
	public declare readonly ['constructor']: typeof EntitlementDERBlob;

	/**
	 * DER data.
	 *
	 * @returns View of DER data.
	 */
	public get der() {
		return subview(
			Uint8Array,
			this.dataView,
			8,
			Math.max(this.derLength, 0)
		);
	}

	/**
	 * DER length.
	 *
	 * @returns Byte length.
	 */
	public get derLength() {
		return this.length - 8;
	}

	/**
	 * @inheritdoc
	 */
	public static readonly typeMagic: number = kSecCodeMagicEntitlementDER;
}
