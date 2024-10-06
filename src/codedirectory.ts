import {Blob} from './blob.ts';
import {kSecCodeMagicCodeDirectory} from './const.ts';

/**
 * Describes secured pieces of a program.
 */
export class CodeDirectory extends Blob {
	public declare readonly ['constructor']: typeof CodeDirectory;

	/**
	 * Compatibility version.
	 *
	 * @returns Version.
	 */
	public get version() {
		return this.dataView.getUint32(8);
	}

	/**
	 * Compatibility version.
	 *
	 * @param value Version.
	 */
	public set version(value: number) {
		this.dataView.setUint32(8, value);
	}

	/**
	 * Setup and mode flags (SecCodeSignatureFlags kSecCodeSignature*).
	 *
	 * @returns Flags.
	 */
	public get flags() {
		return this.dataView.getUint32(12);
	}

	/**
	 * Setup and mode flags (SecCodeSignatureFlags kSecCodeSignature*).
	 *
	 * @param value Flags.
	 */
	public set flags(value: number) {
		this.dataView.setUint32(12, value);
	}

	/**
	 * Offset of hash slot element at index zero.
	 *
	 * @returns Byte offset.
	 */
	public get hashOffset() {
		return this.dataView.getUint32(16);
	}

	/**
	 * Offset of hash slot element at index zero.
	 *
	 * @param value Byte offset.
	 */
	public set hashOffset(value: number) {
		this.dataView.setUint32(16, value);
	}

	/**
	 * Offset of identifier string.
	 *
	 * @returns Byte offset.
	 */
	public get identOffset() {
		return this.dataView.getUint32(20);
	}

	/**
	 * Offset of identifier string.
	 *
	 * @param value Byte offset.
	 */
	public set identOffset(value: number) {
		this.dataView.setUint32(20, value);
	}

	/**
	 * Number of special hash slots.
	 *
	 * @returns Number of slots.
	 */
	public get nSpecialSlots() {
		return this.dataView.getUint32(24);
	}

	/**
	 * Number of special hash slots.
	 *
	 * @param value Number of slots.
	 */
	public set nSpecialSlots(value: number) {
		this.dataView.setUint32(24, value);
	}

	/**
	 * Number of ordinary (code) hash slots.
	 *
	 * @returns Number of slots.
	 */
	public get nCodeSlots() {
		return this.dataView.getUint32(28);
	}

	/**
	 * Number of ordinary (code) hash slots.
	 *
	 * @param value Number of slots.
	 */
	public set nCodeSlots(value: number) {
		this.dataView.setUint32(28, value);
	}

	/**
	 * Limit to main image signature range, 32 bits.
	 *
	 * @returns Limit.
	 */
	public get codeLimit() {
		return this.dataView.getUint32(32);
	}

	/**
	 * Limit to main image signature range, 32 bits.
	 *
	 * @param value Limit.
	 */
	public set codeLimit(value: number) {
		this.dataView.setUint32(32, value);
	}

	/**
	 * Size of each hash in bytes.
	 *
	 * @returns Byte length.
	 */
	public get hashSize() {
		return this.dataView.getUint8(36);
	}

	/**
	 * Size of each hash in bytes.
	 *
	 * @param value Byte length.
	 */
	public set hashSize(value: number) {
		this.dataView.setUint8(36, value);
	}

	/**
	 * Hash type (SecCSDigestAlgorithm kSecCodeSignatureHash*).
	 *
	 * @returns Hash type.
	 */
	public get hashType() {
		return this.dataView.getUint8(37);
	}

	/**
	 * Hash type (SecCSDigestAlgorithm kSecCodeSignatureHash*).
	 *
	 * @param value Hash type.
	 */
	public set hashType(value: number) {
		this.dataView.setUint8(37, value);
	}

	/**
	 * Platform identifier, zero if not platform binary.
	 *
	 * @returns Platform identifier.
	 */
	public get platform() {
		return this.dataView.getUint8(38);
	}

	/**
	 * Platform identifier, zero if not platform binary.
	 *
	 * @param value Platform identifier.
	 */
	public set platform(value: number) {
		this.dataView.setUint8(38, value);
	}

	/**
	 * The log2(page size in bytes), 0 => infinite.
	 *
	 * @returns Page size.
	 */
	public get pageSize() {
		return this.dataView.getUint8(39);
	}

	/**
	 * The log2(page size in bytes), 0 => infinite.
	 *
	 * @param value Page size.
	 */
	public set pageSize(value: number) {
		this.dataView.setUint8(39, value);
	}

	/**
	 * Offset of scatter vector.
	 * Assumes supportsScatter.
	 *
	 * @returns Byte offset, or 0 for none.
	 */
	public get scatterOffset() {
		return this.dataView.getUint32(44);
	}

	/**
	 * Offset of scatter vector.
	 * Assumes supportsScatter.
	 *
	 * @param value Byte offset, or 0 for none.
	 */
	public set scatterOffset(value: number) {
		this.dataView.setUint32(44, value);
	}

	/**
	 * Offset of team identifier.
	 * Assumes supportsTeamID.
	 *
	 * @returns Byte offset, or 0 for none.
	 */
	public get teamIDOffset() {
		return this.dataView.getUint32(48);
	}

	/**
	 * Offset of team identifier.
	 * Assumes supportsTeamID.
	 *
	 * @param value Byte offset, or 0 for none.
	 */
	public set teamIDOffset(value: number) {
		this.dataView.setUint32(48, value);
	}

	/**
	 * Limit to main image signature range, 64 bits.
	 * Assumes supportsCodeLimit64.
	 *
	 * @returns Byte length.
	 */
	public get codeLimit64() {
		return this.dataView.getBigUint64(56);
	}

	/**
	 * Limit to main image signature range, 64 bits.
	 * Assumes supportsCodeLimit64.
	 *
	 * @param value Byte length.
	 */
	public set codeLimit64(value: bigint) {
		this.dataView.setBigUint64(56, value);
	}

	/**
	 * Offset of executable segment (TEXT segment file offset),
	 * Assumes supportsExecSegment.
	 *
	 * @returns Byte offset.
	 */
	public get execSegBase() {
		return this.dataView.getBigUint64(64);
	}

	/**
	 * Offset of executable segment (TEXT segment file offset),
	 * Assumes supportsExecSegment.
	 *
	 * @param value Byte offset.
	 */
	public set execSegBase(value: bigint) {
		this.dataView.setBigUint64(64, value);
	}

	/**
	 * Limit of executable segment (TEXT segment file size).
	 * Assumes supportsExecSegment.
	 *
	 * @returns Byte length.
	 */
	public get execSegLimit() {
		return this.dataView.getBigUint64(72);
	}

	/**
	 * Limit of executable segment (TEXT segment file size).
	 * Assumes supportsExecSegment.
	 *
	 * @param value Byte length.
	 */
	public set execSegLimit(value: bigint) {
		this.dataView.setBigUint64(72, value);
	}

	/**
	 * The exec segment flags (SecCodeExecSegFlags kSecCodeExecSeg*).
	 * Assumes supportsExecSegment.
	 *
	 * @returns Flags.
	 */
	public get execSegFlags() {
		return this.dataView.getBigUint64(80);
	}

	/**
	 * The exec segment flags (SecCodeExecSegFlags kSecCodeExecSeg*).
	 * Assumes supportsExecSegment.
	 *
	 * @param value Flags.
	 */
	public set execSegFlags(value: bigint) {
		this.dataView.setBigUint64(80, value);
	}

	/**
	 * Runtime version encoded as an unsigned integer.
	 * Assumes supportsPreEncrypt.
	 *
	 * @returns Version.
	 */
	public get runtime() {
		return this.dataView.getUint32(88);
	}

	/**
	 * Runtime version encoded as an unsigned integer.
	 * Assumes supportsPreEncrypt.
	 *
	 * @param value Version.
	 */
	public set runtime(value: number) {
		this.dataView.setUint32(88, value);
	}

	/**
	 * Offset of pre-encrypt hash slots.
	 * Assumes supportsPreEncrypt.
	 *
	 * @returns Byte offset, or 0 for none.
	 */
	public get preEncryptOffset() {
		return this.dataView.getUint32(92);
	}

	/**
	 * Offset of pre-encrypt hash slots.
	 * Assumes supportsPreEncrypt.
	 *
	 * @param value Byte offset.
	 */
	public set preEncryptOffset(value: number) {
		this.dataView.setUint32(92, value);
	}

	/**
	 * Get slot data view.
	 *
	 * @param slot Slot index.
	 * @param preEncrypt Pre-encrypt version.
	 * @returns Hash value, or null.
	 */
	public getSlot(slot: number, preEncrypt: boolean) {
		let offset;
		if (preEncrypt) {
			if (
				this.version < this.constructor.supportsPreEncrypt ||
				!(offset = this.preEncryptOffset)
			) {
				return null;
			}
		} else {
			offset = this.hashOffset;
		}
		const {hashSize} = this;
		return new Uint8Array(
			this.buffer,
			this.byteOffset + offset + hashSize * slot,
			hashSize
		);
	}

	/**
	 * @inheritdoc
	 */
	public static readonly sizeof: number = 96;

	/**
	 * @inheritdoc
	 */
	public static readonly typeMagic: number = kSecCodeMagicCodeDirectory;

	/**
	 * Earliest supported version.
	 */
	public static readonly earliestVersion = 0x20001;

	/**
	 * First version to support scatter.
	 */
	public static readonly supportsScatter = 0x20100;

	/**
	 * First version to support team ID.
	 */
	public static readonly supportsTeamID = 0x20200;

	/**
	 * First version to support codeLimit64.
	 */
	public static readonly supportsCodeLimit64 = 0x20300;

	/**
	 * First version to support exec base and limit.
	 */
	public static readonly supportsExecSegment = 0x20400;

	/**
	 * First version to support pre-encrypt hashes and runtime version.
	 */
	public static readonly supportsPreEncrypt = 0x20500;
}
