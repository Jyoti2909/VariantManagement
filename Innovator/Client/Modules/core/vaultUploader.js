import xml from './Xml';
import { soap } from './Soap';
import vault from './vault';
import getResource from './resources';
/**
 * @typedef {File} ExtendedFile
 * @property {String} fileItemId - Id from AML Item of file
 *
 * Internal module type.
 */

/**
 * @typedef {String} FileState
 *
 * Internal module type.
 * Each file have states:
 * - "pending" - file not uploaded and has waiting for upload;
 * - "in progress" - some chunks of file currently are in upload;
 * - "uploaded" - file is uploaded.
 */

/**
 * @typedef {Object} Chunk
 * @property {Blob} data
 * @property {Number} from - Count of file bytes where starts the chunk range
 * @property {Number} to - Count of file bytes where ends the chunk range
 *
 * Internal module type.
 * Serves to allow a possibility to upload a chunk multiple times
 */

/**
 * Serves to store the states of file uploading
 *
 * @param {ExtendedFile} file
 * @param {Boolean} isAsync
 *
 * @property {String} fileName
 * @property {String} fileItemId
 * @property {Number} fileSize
 * @property {File} _file
 * @property {Boolean} _isAsync - Chunks of file can be uploaded synchronously or not
 * @property {FileState} _state
 * @property {Number} _sentBytes - Watch to
 * @property {Number} _readingPoint
 * @property {Number} chunkSize
 *
 * @constructor
 */
class FileWrapper {
	chunkSize = 16 * 1024 * 1024; // 16 Mb

	constructor(file, isAsync, worker) {
		this.fileName = file.name;
		this.fileItemId = file.fileItemId;
		this.fileSize = file.size;

		this._file = file;
		this._isAsync = isAsync;
		this._state = 'pending';

		this._sentBytes = 0;
		this._readingPoint = 0;

		if (this.fileSize && worker) {
			this._hashWaiting = {};
			this._hashes = {};
			this.initialize(worker);
		}
	}
	/**
	 * Method needs to split file at chunks to upload.
	 * Chunks splits by the schema:
	 * ChunkSize = 16 Mb
	 *
	 * file: [________________36Mb________________]
	 * 1 ch: [0Mb + 16Mb]_________________________
	 * 2 ch: ____________[16Mb + 16Mb]____________
	 * 3 ch: _________________________[32Mb + 4Mb]
	 *
	 * @return {Chunk|undefined} undefined if file is empty
	 */
	async getData() {
		this._state = 'in progress';

		if (this.fileSize === 0) {
			return;
		}

		const offset = this._readingPoint;
		this._readingPoint = Math.min(this.fileSize, offset + this.chunkSize);

		if (this.errorMessage) {
			throw new Error(this.errorMessage);
		}

		if (!this._hashes || this._hashes[offset]) {
			return this._formatPacket(offset);
		}

		return new Promise(
			(resolve, reject) => (this._hashWaiting[offset] = { resolve, reject })
		);
	}
	/**
	 * Toggles state of file upload to "uploaded" or "pending"
	 */
	endUpload() {
		this._sentBytes = Math.min(this.fileSize, this._sentBytes + this.chunkSize);
		this._state = this._sentBytes === this.fileSize ? 'uploaded' : 'pending';
	}
	isAllowedUpload() {
		if (
			this._state === 'uploaded' ||
			(!this._isAsync && this._state === 'in progress')
		) {
			return false;
		} else if (this.fileSize === 0 && this._state === 'pending') {
			return true;
		}

		return this._readingPoint < this.fileSize;
	}
	initialize(worker) {
		let offset = 0;
		const receiveHash = (e) => {
			const receivedData = e.data;

			if (receivedData.error) {
				this.errorMessage =
					getResource('item_methods.file_moved_or_renamed', this.fileName) +
					'\r\nDetails: ' +
					receivedData.error;
				if (this._hashWaiting[receivedData.offset]) {
					this._hashWaiting[receivedData.offset].reject(
						new Error(this.errorMessage)
					);
					return;
				}
			}

			if (receivedData.fileId === this.fileItemId) {
				offset = Math.min(this.fileSize, offset + this.chunkSize);
				this._hashes[receivedData.offset] = receivedData.xxhash;

				if (this._hashWaiting[receivedData.offset]) {
					this._hashWaiting[receivedData.offset].resolve(
						this._formatPacket(receivedData.offset)
					);
				}
				if (offset < this.fileSize) {
					worker.postMessage(this._formatPacket(offset));
				}
			}
		};

		worker.addEventListener('message', receiveHash);
		worker.postMessage(this._formatPacket(0));
	}

	_formatPacket(offset) {
		const to = Math.min(this.fileSize, offset + this.chunkSize);
		return {
			fileId: this.fileItemId,
			from: offset,
			to: to,
			hash: this._hashes ? this._hashes[offset] : null,
			data: this._file.slice(offset, to)
		};
	}
}

/**
 * Class is needed for encapsulation of each upload transaction of files
 * to providing opportunity to send more than 1 set of files to upload and prevent conflicts.
 *
 * @param {FileList|File[]} files
 * @param {{credentials: Object, isAsync: Boolean, serverUrl: String}} options
 * @param {String} aml
 *
 * @property {Object} _credentials
 * @property {String} _serverUrl
 * @property {FileWrapper[]} _filesWrappers
 * @property {Number} attempts - The number of attempts of try to repeat upload chunk
 *
 * @constructor
 */
class FilesUploader {
	constructor(files, options, aml) {
		this._credentials = { ...options.credentials };
		this._serverUrl = options.serverUrl;
		this._fileWrappers = [];
		this.attempts = 10;
		this.progressCallback = options.progress;

		this._initFileWrappers(files, !!options.isAsync, aml);
	}
	/**
	 * @param {FileList|File[]} files
	 * @param {Boolean} isAsync
	 * @param {String} aml
	 * @private
	 */
	_initFileWrappers(files, isAsync, aml) {
		const doc = xml.parseString(aml);
		const fileItems = xml.selectNodes(
			doc,
			"//Item[@type='File' and @action='add']"
		);
		if (!this._serverUrl.startsWith('https')) {
			this._xxhWorker = new Worker('../Modules/core/xxhWorker.js');
		}

		// search item file id for upload transaction
		const wrappersArray = Array.from(files).map((file) => {
			let index;
			const foundFileItem = fileItems.find((fileItem, idx) => {
				index = idx;
				return (
					file.name === fileItem.selectSingleNode('filename').text &&
					file.size === +fileItem.selectSingleNode('file_size').text
				);
			});
			file.fileItemId = foundFileItem.getAttribute('id');
			fileItems.splice(index, 1);
			return new FileWrapper(file, isAsync, this._xxhWorker);
		});

		this._fileWrappers = [...this._fileWrappers, ...wrappersArray];
	}
	/**
	 * Sets the existing transaction id as request header with the other headers.
	 * Thus server can identify a context of uploaded files
	 *
	 * @param {XMLHttpRequest} xhr
	 * @param {Object} [headers]
	 * @private
	 */
	_setHeaders(xhr, headers = {}) {
		const topWnd = TopWindowHelper.getMostTopWindowWithAras();
		const aras = topWnd.aras;

		headers = {
			...this._credentials,
			...headers,
			...aras.OAuthClient.getAuthorizationHeader()
		};

		if (this._transactionId) {
			headers.transactionid = this._transactionId;
		}

		Object.keys(headers).forEach(function (header) {
			xhr.setRequestHeader(header, headers[header]);
		});
	}
	/**
	 * @param {String|Node} response
	 * @returns {Node|undefined}
	 * @private
	 */
	_selectResultNode(response) {
		if (response.nodeName) {
			return response;
		}

		const xmlModule = xml;
		const doc = xmlModule.parseString(response);

		return xmlModule.selectSingleNode(doc, '//Result');
	}
	/**
	 * Serves to beginning of upload transaction on the server and takes its transaction id
	 *
	 * @returns {Promise} Resolves without parameters
	 */
	async beginTransaction() {
		try {
			const response = await soap('', {
				async: true,
				method: 'BeginTransaction',
				url: this._serverUrl,
				headers: { ...this._credentials }
			});
			const node = this._selectResultNode(response);

			if (!node) {
				// will caught below to throw an error
				await Promise.reject(new Error("Response doesn't contain Result node"));
			}

			this._transactionId = node.text;
		} catch (res) {
			if (res instanceof Error) {
				throw res;
			}
			throw new Error(
				res.status +
					' occurred while beginning transaction with text: ' +
					res.responseText
			);
		}
	}
	/**
	 * Serves to rollback of upload transaction on the server which removes earlier uploaded files
	 *
	 * @returns {undefined | Promise} undefined returns if no sense in rollback | Promise resolves with xhr
	 */
	async rollbackTransaction() {
		if (!this._transactionId) {
			return;
		}

		return await soap('', {
			async: true,
			method: 'RollbackTransaction',
			url: this._serverUrl,
			headers: { transactionid: this._transactionId, ...this._credentials }
		});
	}
	/**
	 * Serves to commit of upload transaction on the server and applies aml as the context of uploaded files
	 *
	 * @param {String} aml
	 * @returns {Promise} Resolves with xml node
	 */
	commitTransaction(aml) {
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			const xhr = new XMLHttpRequest();

			formData.append('XMLData', aml);

			xhr.open('POST', this._serverUrl, true);
			this._setHeaders(xhr, {
				SOAPAction: 'CommitTransaction'
			});
			xhr.addEventListener('error', () => {
				reject(xhr);
			});
			xhr.addEventListener('load', () => {
				if (xhr.status < 200 || xhr.status > 299) {
					reject(xhr);
				} else {
					const node = this._selectResultNode(xhr.responseText);

					if (!node) {
						reject(xhr);
					}

					resolve(node);
				}
			});
			xhr.send(formData);
		}).catch((xhr) => {
			if (xhr.status === 200) {
				const responseXML = xml.parseString(xhr.responseText);
				throw responseXML;
			}

			throw new Error(
				xhr.status +
					' occurred while commit transaction with text: ' +
					xhr.responseText
			);
		});
	}
	/**
	 * Encodes file name for Content-Disposition
	 *
	 * @returns {String} Encoded string
	 * @private
	 */
	_encodeRFC5987ValueChars(str) {
		// noinspection JSDeprecatedSymbols
		return encodeURIComponent(str)
			.replace(/['()]/g, escape) // i.e., %27 %28 %29
			.replace(/\*/g, '%2A')
			.replace(/%(?:7C|60|5E)/g, unescape);
	}
	/**
	 * @returns {undefined | FileWrapper} A wrapper of file which is not uploaded fully
	 * @private
	 */
	_searchNotUploadedFile() {
		return this._fileWrappers.find((fileWrapper) =>
			fileWrapper.isAllowedUpload()
		);
	}
	/** @private */
	_upload(fileWrapper, dataObject) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			const url =
				this._serverUrl +
				(this._serverUrl.indexOf('?') > -1 ? '&' : '?') +
				'fileId=' +
				fileWrapper.fileItemId;

			xhr.open('POST', url, true);
			xhr.addEventListener('error', (event) => {
				const xhr = event.target;
				// Detect that file was removed or rename
				if (xhr.readyState === 4 && xhr.status === 0) {
					this.attempts = 0;
					const message =
						getResource(
							'item_methods.file_moved_or_renamed',
							fileWrapper.fileName
						) +
						'\r\nDetails: ' +
						xhr.statusText;
					reject(message);
					return;
				}
				reject(xhr.statusText);
			});
			xhr.addEventListener('load', function (event) {
				if (event.target.status !== 200) {
					reject(event.target.statusText);
					return;
				}
				fileWrapper.endUpload();
				resolve();
			});

			const contentRange = !dataObject
				? '*/0'
				: dataObject.from +
				  '-' +
				  (dataObject.to - 1) +
				  '/' +
				  fileWrapper.fileSize;

			const headers = {
				'Content-Type': 'application/octet-stream',
				'Content-Range': 'bytes ' + contentRange,
				SOAPAction: 'UploadFile',
				'Content-Disposition':
					"attachment; filename*=utf-8''" +
					this._encodeRFC5987ValueChars(fileWrapper.fileName)
			};
			if (this._xxhWorker) {
				headers['Aras-Content-Range-Checksum'] = dataObject
					? dataObject.hash
					: '46947589';
				headers['Aras-Content-Range-Checksum-Type'] =
					'xxHashAsUInt32AsDecimalString';
			}
			this._setHeaders(xhr, headers);
			xhr.send(dataObject ? dataObject.data : null);
		}).catch((message) => {
			if (this.attempts > 0) {
				this.attempts--;
				return this._upload(fileWrapper, dataObject);
			}
			this.attempts--;
			return Promise.reject(message);
		});
	}
	/**
	 * Serves to filter and send data to the server
	 *
	 * @returns {Promise} undefined returns if no data to send or file already loaded in sync mode
	 * Promise resolves without parameters
	 */
	async send() {
		const fileWrapper = this._searchNotUploadedFile();
		if (!fileWrapper || this.attempts === -1) {
			return;
		}
		const dataPromise = fileWrapper.getData();
		this.indicateProgress(fileWrapper);
		const data = await dataPromise;
		await this._upload(fileWrapper, data);
		this.indicateProgress(fileWrapper);

		await this.send();
	}
	indicateProgress(fileWrapper) {
		if (this.progressCallback) {
			const currentFileProgress = this.getFileProgress(fileWrapper);
			const allFilesProgress = this._fileWrappers.map(this.getFileProgress);
			this.progressCallback(currentFileProgress, allFilesProgress);
		}
	}
	getFileProgress(fileWrapper) {
		return {
			state: fileWrapper._state,
			fileName: fileWrapper.fileName,
			fileItemId: fileWrapper.fileItemId,
			fileSize: fileWrapper.fileSize,
			sentBytes: fileWrapper._sentBytes,
			isAsync: fileWrapper._isAsync
		};
	}
	destroyWorker() {
		if (this._xxhWorker) {
			this._xxhWorker.terminate();
			this._xxhWorker = null;
		}
	}
}

/**
 * Serves to control upload queue of data.
 * For each call of send makes new instance of it to avoid redundant
 * complexity in cases when exists only one vault instance in application.
 *
 * @constructor
 */
class RequestsManager {
	parallelRequests = 3;
	constructor() {}
	/**
	 * Serves to start parallel requests
	 *
	 * @param {FilesUploader} filesUploader
	 * @returns {Promise} Resolves without parameters
	 * @private
	 */
	async _upload(filesUploader) {
		const array = [];
		for (let i = this.parallelRequests; i--; ) {
			array.push(filesUploader.send());
		}

		return await Promise.all(array);
	}
	/**
	 * Serves to control action sequence of upload
	 *
	 * @param {FileList|File[]} files
	 * @param {{credentials: Object, isAsync: Boolean, serverUrl: String}} options
	 * @param {String} aml
	 * @returns {Promise|undefined} Resolves with response after commit transaction
	 */
	async send(files, options, aml) {
		const filesUploader = new FilesUploader(files, options, aml);

		try {
			await filesUploader.beginTransaction();
			await this._upload(filesUploader);
			filesUploader.destroyWorker();
			const result = await filesUploader.commitTransaction(aml);
			return result;
		} catch (e) {
			filesUploader.destroyWorker();
			filesUploader.rollbackTransaction();
			throw e;
		}
	}
}

let vaultUploader = {
	options: {
		serverUrl: 'http://localhost/S11-0-SP8',
		credentials: {},
		isAsync: false
	},
	/**
	 * @param {FileList|File[]} files
	 * @param {String} aml
	 * @param {Object} options
	 * @param {Function} {options.progress} progress callback
	 * @returns {Promise}
	 */
	send: function (files, aml, options) {
		return new RequestsManager().send(
			files,
			{ ...this.options, ...options },
			aml
		);
	}
};

vaultUploader = Object.assign(vault || {}, vaultUploader);
export default vaultUploader;
