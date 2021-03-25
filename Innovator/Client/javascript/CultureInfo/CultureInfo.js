/* global DateTimeFormatInfo */
let _invariantCultureCache = null;
// eslint-disable-next-line no-unused-vars
class CultureInfo {
	constructor(locale) {
		this.locale = locale;
		this.dateFormat = null;
	}

	static get InvariantCulture() {
		if (!_invariantCultureCache) {
			_invariantCultureCache = new CultureInfo('en-us');
		}
		return _invariantCultureCache;
	}

	get DateTimeFormat() {
		if (!this.dateFormat) {
			this.dateFormat = new DateTimeFormatInfo(this.locale);
		}
		return this.dateFormat;
	}

	get Name() {
		return this.locale;
	}

	static CreateSpecificCulture(locale) {
		return new CultureInfo(locale);
	}
}
