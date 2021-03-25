const vault = {
	_downloadHelper: function (url, async) {
		const frameId = 'downloadFrame';
		const download = function () {
			let frame = document.getElementById(frameId);
			if (frame === null) {
				frame = document.createElement('iframe');
				frame.id = frameId;
				frame.style.display = 'none';
				document.body.appendChild(frame);
			}
			frame.src = url;
		};
		const xhr = new XMLHttpRequest();
		xhr.open('HEAD', url, async);
		xhr.send();
		if (async) {
			return new Promise(function (resolve, reject) {
				const asyncCallback = function (e) {
					if (e.target.status !== 200) {
						return reject(
							new Error(
								`The file has not been downloaded: (${e.target.status}) ${e.target.statusText}`
							)
						);
					}
					download();
					resolve();
				};
				const errorCallback = function (e) {
					reject(
						new Error(
							`Connection error: (${e.target.status || 500}) ${
								e.target.statusText
							}`
						)
					);
				};
				xhr.addEventListener('load', asyncCallback);
				xhr.addEventListener('error', errorCallback);
			});
		} else {
			if (xhr.status !== 200) {
				throw new Error(
					'Server status: ' + xhr.status + '. The file has not been downloaded!'
				);
			}
			download();
		}
	},
	/**
	 * Downloading file using frame.
	 * Create HEAD request to check if file exists and
	 * use frame to download it.

	 * @param {string} url
	 * @return {Promise}
	*/
	downloadFile: function (url) {
		return this._downloadHelper(url, true);
	},

	/**
	 * Opening file select dialog.

	 * @return {Promise}
	*/
	selectFile: function () {
		const previouslyAddedNode = document.getElementById('fileSelector');
		if (previouslyAddedNode) {
			document.body.removeChild(previouslyAddedNode);
		}
		const inputNode = document.createElement('input');
		inputNode.style.display = 'none';
		inputNode.type = 'file';
		inputNode.id = 'fileSelector';
		document.body.appendChild(inputNode);

		return new Promise(function (resolve) {
			inputNode.addEventListener(
				'change',
				function (e) {
					resolve(e.target.files[0]);
					document.body.removeChild(e.target);
				},
				false
			);
			inputNode.click();
		});
	},

	/**
	 * Saving Blob object as file.
	 * Create link with download attribute
	 * and trigger click on it to open window.
	 @param {string} blob
	 @param {string} fileName
	 */
	saveBlob: function (blob, fileName) {
		const link = document.createElement('a');
		link.style.display = 'none';
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
};

export default vault;
