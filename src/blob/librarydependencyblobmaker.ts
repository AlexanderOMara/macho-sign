import {LibraryDependencyBlob} from './librarydependencyblob.ts';
import {SuperBlobMaker} from './superblobmaker.ts';

/**
 * SuperBlob maker for LibraryDependencyBlob.
 */
export class LibraryDependencyBlobMaker extends SuperBlobMaker {
	public declare readonly ['constructor']: Omit<
		typeof LibraryDependencyBlobMaker,
		'new'
	>;

	/**
	 * @inheritdoc
	 */
	public static readonly SuperBlob = LibraryDependencyBlob;
}
