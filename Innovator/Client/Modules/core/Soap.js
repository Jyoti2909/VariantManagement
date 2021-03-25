const globalConfig = {
	headers: {},
	async: false,
	soapConfig: {},
	appendMethodToURL: false,
	restMethod: 'POST',
	soap12: false
};

function soap(data, options) {
	const config = {};
	options = options || {};

	if (options.headers) {
		Object.keys(options.headers).forEach(function (key) {
			options.headers[key] = encodeURIComponent(options.headers[key]).replace(
				/%20/g,
				unescape
			);
		});
	}

	if (data === null) {
		Object.assign(globalConfig, options);
		return;
	}

	Object.assign(config, globalConfig, options);

	Object.assign(
		SOAPTool.settings,
		config.soap12 ? SOAP12 : SOAP11,
		globalConfig.soapConfig
	);
	if (typeof options.soapConfig === 'object') {
		Object.assign(SOAPTool.settings, options.soapConfig);
	}

	if (config.url) {
		let url = config.url;
		if (config.appendMethodToURL && !!config.method) {
			url += config.method;
		}
		if (!config.soap12 && (config.method || config.SOAPAction)) {
			config.headers.SOAPAction = config.SOAPAction || config.method;
		}

		const soapMessage = SOAPTool.createSoapMessage(
			data,
			config.method,
			config.methodNm
		);

		return SOAPTool.send(soapMessage, {
			url: url,
			credentials: config.credentials,
			async: config.async,
			headers: config.headers,
			restMethod: config.restMethod
		});
	}
}

const SOAP11 = {
	type: 'text/xml',
	headers: '',
	customNS: {},
	prefix: 'SOAP-ENV',
	namespace: 'http://schemas.xmlsoap.org/soap/envelope/'
};
const SOAP12 = {
	type: 'application/soap+xml',
	headers: '',
	customNS: {},
	prefix: 'env',
	namespace: 'http://www.w3.org/2003/05/soap-envelope'
};

const SOAPTool = {
	settings: {},
	createSoapMessage: function (xml, method, namespace) {
		const prefix = this.settings.prefix;
		const customNS = this.settings.customNS;
		let message =
			'<' +
			prefix +
			':Envelope xmlns:' +
			prefix +
			'="' +
			this.settings.namespace +
			'" ';

		Object.keys(customNS).forEach(function (ns) {
			message += ns + '="' + customNS[ns] + '" ';
		});

		message += '><' + prefix + ':Body>';

		if (method) {
			message +=
				'<' + method + (namespace ? ' xmlns="' + namespace + '">' : '>');
		}

		message += typeof xml === 'string' ? xml : this.dom2string(xml);

		if (method) {
			message += '</' + method + '>';
		}

		message += '</' + prefix + ':Body></' + prefix + ':Envelope>';
		return message;
	},
	abort: function (xhr) {
		return function () {
			xhr.onpropertychange = function () {};
			xhr.abort();
		};
	},
	getResult: function (xhr) {
		let isFault = false;
		let resultNode;
		const xml = this.parseToXml(xhr);
		if (xml && xml.firstChild && xml.firstChild.firstChild) {
			const result = xml.firstChild.firstChild.firstChild;
			isFault = result && result.nodeName.toLowerCase() === 'soap-env:fault';
			resultNode =
				(result && result.nodeName.toLowerCase() === 'result') || isFault
					? result
					: null;
		}
		return {
			isFault: isFault,
			resultNode: resultNode
		};
	},
	parseToXml: function (xhr) {
		return xhr.responseXML;
	},
	send: function (data, config) {
		let promise;
		const req = new XMLHttpRequest();
		req.open(config.restMethod, config.url, config.async);
		req.setRequestHeader(
			'Content-Type',
			this.settings.type + '; charset=UTF-8'
		);

		if (config.credentials) {
			req.withCredentials = true;
		}

		Object.keys(config.headers).forEach(function (key) {
			req.setRequestHeader(key, config.headers[key]);
		});
		const _self = this;
		if (config.async) {
			promise = new Promise(function (resolve, reject) {
				req.onreadystatechange = function () {
					if (this.readyState === 4 && this.status === 200) {
						const obj = _self.getResult(req);
						if (obj.isFault) {
							reject(req);
						} else {
							resolve(obj.resultNode || req.responseText);
						}
					} else if (this.readyState === 4) {
						reject(req);
					}
				};
				req.send(config.restMethod.toLowerCase() === 'get' ? null : data);
			});
		} else {
			promise = new SyncPromise(function (resolve, reject) {
				try {
					req.send(config.restMethod.toLowerCase() === 'get' ? null : data);
				} catch (e) {
					return reject(req);
				}

				if (req.status === 200) {
					const obj = _self.getResult(req);
					if (obj.isFault) {
						reject(req);
					} else {
						resolve(obj.resultNode || req.responseText);
					}
				} else {
					reject(req);
				}
			});
		}
		promise.abort = this.abort(req);
		return promise;
	},
	dom2string: function (dom) {
		if (window.XMLSerializer) {
			return new window.XMLSerializer().serializeToString(dom);
		} else {
			return dom.xml;
		}
	}
};

function SyncPromise(func) {
	let argValue;
	let isReject = false;
	func(
		function (value) {
			argValue = value;
		},
		function (value) {
			argValue = value;
			isReject = true;
		}
	);

	this.then = function (funcResolve, funcReject) {
		let value;
		if (!isReject) {
			value = funcResolve.call(null, argValue);
			return value instanceof SyncPromise ? value : SyncPromise.resolve(value);
		} else if (funcReject && isReject) {
			value = funcReject.call(null, argValue);
			return value instanceof SyncPromise ? value : SyncPromise.reject(value);
		}
		return this;
	};
	this['catch'] = function (funcReject) {
		if (isReject) {
			const value = funcReject.call(null, argValue);
			return value instanceof SyncPromise ? value : SyncPromise.reject(value);
		}
		return this;
	};
}
SyncPromise.resolve = function (value) {
	return new SyncPromise(function (resolve, reject) {
		resolve(value);
	});
};
SyncPromise.reject = function (value) {
	return new SyncPromise(function (resolve, reject) {
		reject(value);
	});
};
export { SyncPromise, soap };
