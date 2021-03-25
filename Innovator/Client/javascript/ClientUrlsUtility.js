function ClientUrlsUtility(baseUrl) {
	if (!baseUrl) {
		throw new Error('Parameter baseUrl must be defined and be not empty.');
	}

	this._salt = '';
	const uri = new URL(baseUrl);
	let pathname = uri.pathname;
	const saltRegExp = new RegExp('X-(salt=[^\\/]*)-X');
	const match = saltRegExp.exec(pathname);

	if (match) {
		this._salt = match[1];
		pathname = pathname.substring(0, match.index);
	}

	const sections = pathname.split('/');
	this._baseUrlWithoutSalt = uri.origin;

	for (let i = 0; i < sections.length - 1; i++) {
		const section = sections[i];

		if (!section) {
			continue;
		}

		this._baseUrlWithoutSalt += '/' + section;

		if (section.match(/^Client$/i)) {
			break;
		}
	}
}

ClientUrlsUtility.prototype.getBaseUrlWithoutSalt = function ClientUrlsUtilityGetBaseUrlWithoutSalt() {
	return this._baseUrlWithoutSalt;
};

ClientUrlsUtility.prototype.getSalt = function ClientUrlsUtilityGetSalt() {
	return this._salt;
};
