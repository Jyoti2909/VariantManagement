/* global CryptoJS */
(function (externalParent) {
	const cryptohash = {};

	function hex(buffer) {
		const hexCodes = [];
		const view = new DataView(buffer);
		for (let i = 0; i < view.byteLength; i += 4) {
			// Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
			const value = view.getUint32(i);
			// toString(16) will give the hex representation of the number without padding
			const stringValue = value.toString(16);
			// We use concatenation and slice for padding
			const padding = '00000000';
			const paddedValue = (padding + stringValue).slice(-padding.length);
			hexCodes.push(paddedValue);
		}

		// Join all the hex strings into one
		return hexCodes.join('');
	}

	cryptohash.SHA256 = function (str) {
		if (typeof window.crypto !== 'undefined' && crypto.subtle) {
			const buffer = new TextEncoder('utf-8').encode(str);

			return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
				return hex(hash);
			});
		} else {
			// eslint-disable-next-line new-cap
			return Promise.resolve(CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex));
		}
	};

	cryptohash.MD5 = function (message, config) {
		// eslint-disable-next-line new-cap
		return CryptoJS.MD5(message, config);
	};

	cryptohash.xxHash = function () {
		throw new Error('Cryptohash.xxHash not implemented');
	};

	externalParent.cryptohash = cryptohash;

	window.ArasModules = window.ArasModules || externalParent;
})(window.ArasModules || {});
