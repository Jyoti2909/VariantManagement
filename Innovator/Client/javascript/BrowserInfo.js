function BrowserInfo(userAgent) {
	userAgent = userAgent || window.navigator.userAgent;

	//private properties
	var browserCode;
	var versionStr;
	//variables for private properties initialization
	var knownBrowsers = {
		edge: {
			certifiedVersions: {},
			getNameToDisplay: function () {
				return 'Microsoft Edge ' + parseInt(versionStr, 10);
			},
			minimalVersion: Number.POSITIVE_INFINITY,
			patterns: [/Edge\/(\d+)/]
		},
		ch: {
			minCertifiedVersions: 72,
			getNameToDisplay: function () {
				return 'Chrome ' + parseInt(versionStr, 10);
			},
			minimalVersion: 72,
			patterns: [/Chrome\/(\S+)/]
		},
		ff: {
			certifiedVersions: {
				68: true,
				78: true
			},
			getNameToDisplay: function () {
				return 'FireFox ' + parseInt(versionStr, 10);
			},
			minimalVersion: 68,
			patterns: [/Firefox\/(\S+)/]
		},
		ie: {
			certifiedVersions: {},
			getNameToDisplay: function () {
				var declaredIEVersion = parseInt(versionStr, 10);
				//Trident/X.X appeared in userAgent string in IE 8
				//Presence of this string will help us detect IE working in compatibility mode
				var tridentVersionToIEVersion = {
					'4.0': 8,
					'5.0': 9,
					'6.0': 10,
					'7.0': 11
				};
				var res;
				var matcher = userAgent.match(/Trident\/(\S+);/);
				var tridentVersion;
				var realIEVersion;

				//default result
				res = 'Internet Explorer ' + declaredIEVersion;
				//detect for compatibility mode
				if (matcher) {
					tridentVersion = matcher[1];
					realIEVersion = tridentVersionToIEVersion[tridentVersion];
					if (realIEVersion && realIEVersion != declaredIEVersion) {
						res =
							'Internet Explorer ' +
							realIEVersion +
							' in Internet Explorer ' +
							declaredIEVersion +
							' Compatibility View Mode';
					}
				}

				return res;
			},
			minimalVersion: Number.POSITIVE_INFINITY,
			patterns: [
				//for IE 2.0 - 10.0
				/MSIE (\S+);/,
				//for IE 11.0 and perhaps for later versions
				/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/
			]
		},
		sa: {
			certifiedVersions: {},
			getNameToDisplay: function () {
				return 'Safari ' + parseInt(versionStr, 10);
			},
			minimalVersion: Number.POSITIVE_INFINITY,
			patterns: [/Version\/(\S+).* Safari\/\S+/]
		}
	};
	var patterns;
	var regExp;
	var matcher;
	var candidateCode;

	//private properties initialization
	for (candidateCode in knownBrowsers) {
		patterns = knownBrowsers[candidateCode].patterns;
		while ((regExp = patterns.shift())) {
			//jshint ignore:line
			matcher = userAgent.match(regExp);
			if (matcher) {
				browserCode = candidateCode;
				//we need browser version with not more than two elements of version number.
				//Browser version in form "11.22" is enough for our needs.
				versionStr = matcher[1].match(new RegExp('[^.]+(?:.[^.]+){0,1}'))[0]; //jshint ignore:line
				break;
			}
		}
		if (browserCode !== undefined) {
			break;
		}
	}

	//public methods
	this.isFf = function () {
		return browserCode === 'ff';
	};
	this.isIe = function () {
		return browserCode === 'ie';
	};
	this.isCh = function () {
		return browserCode === 'ch';
	};
	this.isEdge = function () {
		return browserCode === 'edge';
	};
	this.isKnown = function () {
		return Boolean(browserCode);
	};
	this.isSupported = function () {
		return Boolean(
			browserCode &&
				parseFloat(versionStr) >= knownBrowsers[browserCode].minimalVersion
		);
	};
	this.isCertified = function () {
		var knownBrowser = knownBrowsers[browserCode];
		var browserVersion = parseFloat(versionStr);
		return Boolean(
			browserCode &&
				((knownBrowser.minCertifiedVersions &&
					browserVersion >= knownBrowser.minCertifiedVersions) ||
					(knownBrowser.certifiedVersions &&
						knownBrowser.certifiedVersions[browserVersion]))
		);
	};
	this.getBrowserName = function () {
		var res;
		if (browserCode) {
			res = knownBrowsers[browserCode].getNameToDisplay();
		} else {
			res = '';
		}
		return res;
	};
	this.getBrowserCode = function () {
		return browserCode;
	};
	this.getMajorVersionNumber = function () {
		return parseInt(versionStr, 10);
	};
	(this.isKeepaliveOptionSupported = function () {
		try {
			return 'keepalive' in new Request('');
		} catch (e) {
			return false;
		}
	}),
		Object.defineProperty(this, 'OSName', {
			writable: false,
			configurable: false,
			enumerable: true,
			value: (function () {
				var OSName = 'Unknown';
				if (userAgent.indexOf('Win') != -1) {
					OSName = 'Windows';
				}
				if (userAgent.indexOf('Mac') != -1) {
					OSName = 'MacOS';
				}
				return OSName;
			})()
		});
}
