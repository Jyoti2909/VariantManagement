define([], function () {
	var util = {
		isDataUrl: function (url) {
			return /^data:.+/.test(url);
		},
		isSvgUrl: function (url) {
			return /.+\.svg$/gi.test(url);
		},
		isExternalUrl: function (url) {
			return url.indexOf('http://') === 0;
		},
		getCssText: function (style) {
			var result = '';
			for (var i = 0; i < style.length; i++) {
				result += style[i] + ': ' + style.getPropertyValue(style[i]) + '; ';
			}
			return result;
		}
	};

	function DomToSVG() {}

	DomToSVG.prototype._copyCSS = function (clone, origElem) {
		var style = this.win.getComputedStyle(origElem);
		//firefox does not return cssText https://bugzilla.mozilla.org/show_bug.cgi?id=137687
		clone.style.cssText = style.cssText || util.getCssText(style);
		if (style.zIndex === '-1') {
			clone.style.cssText += '; z-index: 0;';
		}
		// For all non-root svg nodes Chrome sets width and height style to 'auto',
		// even if exact value was specified. In this case element is not rendered at all.
		// Replace 'auto' css values on nodes where width and height attributes are present.
		this._attributeSizeToCss(clone);
	};

	/**
	 * set inline width and height attributes (if present) as css property instead of 'auto' value
	 *
	 * @param {HTMLElement} elem - cloned HTML element
	 * @private
	 */
	DomToSVG.prototype._attributeSizeToCss = function (elem) {
		var width = elem.getAttribute('width');
		var height = elem.getAttribute('height');
		if (width && elem.style.width === 'auto') {
			elem.style.width = width;
		}
		if (height && elem.style.height === 'auto') {
			elem.style.height = height;
		}
	};

	/**
	 * set computed style for all cloned dom nodes
	 *
	 * @param {HTMLElement} elem - cloned HTML element
	 * @param {HTMLElement} origElem  - original HTML element
	 * @param {Array} promises - array of Promises
	 * @private
	 */
	DomToSVG.prototype._setInlineStyles = function (elem, origElem, promises) {
		var children = elem.querySelectorAll('*');
		var origChildren = origElem.querySelectorAll('*');
		this._copyCSS(elem, origElem);
		Array.prototype.forEach.call(
			children,
			function (child, i) {
				this._copyCSS(child, origChildren[i]);
				this._svgToBase64(child, promises);
				this._clonePseudoElements(child, origChildren[i], ':before', promises);
				this._clonePseudoElements(child, origChildren[i], ':after', promises);
			}.bind(this)
		);
		//cleaning of outer margin
		elem.style.margin = elem.style.marginLeft = elem.style.marginTop = elem.style.marginBottom = elem.style.marginRight =
			'0';
	};

	/**
	 * cloning pseudo element
	 *
	 * @param {HTMLElement} clone - cloned HTML element
	 * @param {HTMLElement} original - original HTML element
	 * @param {string} element - selector pseudo element
	 * @param {Array} promises -array of Promises
	 * @private
	 */
	DomToSVG.prototype._clonePseudoElements = function (
		clone,
		original,
		element,
		promises
	) {
		var style = this.win.getComputedStyle(original, element);
		var content = style.getPropertyValue('content');

		if (content === '' || content === 'none') {
			return;
		}

		var spanElement = this.win.document.createElement('span');
		var cssText = style.cssText || util.getCssText(style);

		var promise = this._cssbackgroundToBase64(style['background-image']);
		if (promise) {
			promise = promise.then(function (background) {
				cssText += ' background-image: ' + background + ';';
				return cssText;
			});
		} else {
			promise = Promise.resolve(cssText);
		}
		promises.push(
			promise.then(
				function (cssText) {
					spanElement.style.cssText = cssText;
					clone.appendChild(spanElement);
				}.bind(this)
			)
		);
	};

	/**
	 * copy value in attribute "value"
	 *
	 * @param {HTMLElement} elem - root cloned element
	 * @private
	 */
	DomToSVG.prototype._valueToAttribute = function (elem) {
		var children = elem.querySelectorAll('input');
		Array.prototype.forEach.call(children, function (child, i) {
			if (child.value !== child.getAttribute('value')) {
				child.setAttribute('value', child.value);
			}
		});

		children = elem.querySelectorAll('textarea');
		Array.prototype.forEach.call(children, function (child, i) {
			child.innerHTML = child.value;
		});
	};

	/**
	 * convert svg image to base64
	 *
	 * @param {string} url - linked image svg
	 * @returns {Promise}
	 * @private
	 */
	DomToSVG.prototype._getBase64Image = function (url) {
		return new Promise(
			function (resolve) {
				var img = new Image();
				img.onload = function () {
					this.canvas.width = img.width;
					this.canvas.height = img.height;
					var ctx = this.canvas.getContext('2d');
					ctx.drawImage(img, 0, 0);
					resolve(this.canvas.toDataURL('image/png', ''));
				}.bind(this);
				img.onerror = function () {
					resolve();
				};
				img.src = util.isExternalUrl(url) ? url : baseUrl + '/' + url;
			}.bind(this)
		);
	};

	/**
	 * conver background with svg image to base64
	 *
	 * @param {string} backgraund - value background property
	 * @returns {boolean} or {Promise.<string>} - a promise that returns new background value
	 * @private
	 */
	DomToSVG.prototype._cssbackgroundToBase64 = function (backgraund) {
		var parseBg = backgraund.match(/url\(\"(.+)(\"\))/);
		if (parseBg && !util.isDataUrl(parseBg[1]) && util.isSvgUrl(parseBg[1])) {
			var promise = this._getBase64Image(parseBg[1]).then(function (imgStr) {
				if (imgStr) {
					backgraund = backgraund.replace(parseBg[1], imgStr);
				}
				return backgraund;
			});
			return promise;
		} else {
			return false;
		}
	};

	/**
	 * Convert svg images to base64 from src attribute and from css background
	 *
	 * @param {HTMLElement} elem - cloned element
	 * @param {Array} promises - array of Promises
	 * @private
	 */
	DomToSVG.prototype._svgToBase64 = function (elem, promises) {
		var promise;
		if (elem.src && !util.isDataUrl(elem.src) && util.isSvgUrl(elem.src)) {
			promise = this._getBase64Image(elem.src).then(function (imgStr) {
				if (imgStr) {
					elem.setAttribute('src', imgStr);
				}
			});
			promises.push(promise);
		}

		promise = this._cssbackgroundToBase64(elem.style.background);
		if (promise) {
			promise = promise.then(function (background) {
				elem.style.background = background;
			});
			promises.push(promise);
		}
	};

	DomToSVG.prototype._removeScriptTag = function (elem) {
		var scripts = Array.prototype.slice.call(
			elem.getElementsByTagName('script')
		);
		var length = scripts.length;
		for (var i = 0; i < length; i++) {
			scripts[i].parentElement.removeChild(scripts[i]);
		}
	};

	DomToSVG.prototype._removeEventAttribute = function (element) {
		var attrs = Array.prototype.slice.call(element.attributes);
		for (var i = 0; i < attrs.length; i++) {
			if (attrs[i].name.indexOf('on') === 0) {
				element.removeAttribute(attrs[i].name);
			}
		}
	};

	DomToSVG.prototype._removeAttribute = function (elem) {
		var children = elem.querySelectorAll('*');
		this._removeEventAttribute(elem);
		Array.prototype.forEach.call(
			children,
			function (child, i) {
				this._removeEventAttribute(child);
			}.bind(this)
		);
	};

	/**
	 * render HTML element on canvas
	 *
	 * @param {HTMLElement} element - HTML element for convert
	 * @param {integer} width - width svg image
	 * @param {integer} height - height svg image
	 * @param {integer} left - left offeset
	 * @param {integer} top - top offset
	 * @returns {Promise.<Image>} - a promise that returns a image if resolved
	 */
	DomToSVG.prototype.toSVG = function (element, width, height, left, top) {
		left = left || 0;
		top = top || 0;
		this._valueToAttribute(element);
		var elem = element.cloneNode(true);
		var doc = element.ownerDocument;
		this.win = doc.defaultView || doc.parentWindow;
		elem.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
		this.canvas = doc.createElement('canvas');
		this.baseUrl = this.win.location.href.split('/').splice(-1).join('/');
		var promises = [];
		this._setInlineStyles(elem, element, promises);
		this._removeScriptTag(elem);
		this._removeAttribute(elem);
		elem.style.width = width + 'px';
		elem.style.height = height + 'px';
		return Promise.all(promises).then(function () {
			// serialize the DOM node to a String
			var serialized = new XMLSerializer().serializeToString(elem);
			// Create well formed data URL with our DOM string wrapped in SVG
			var dataUri =
				'data:image/svg+xml,' +
				encodeURIComponent(
					'<svg xmlns="http://www.w3.org/2000/svg" width="' +
						((width || element.offsetWidth) + left) +
						'" height="' +
						((height || element.offsetHeight) + top) +
						'">' +
						'<rect x="10" y="10" width="' +
						((width || element.offsetWidth) + left) +
						'" height="' +
						((height || element.offsetHeight) + top) +
						'" fill="white"/>' +
						'<foreignObject width="100%" height="100%" x="' +
						left +
						'" y="' +
						top +
						'">' +
						serialized +
						'</foreignObject>' +
						'</svg>'
				);
			var img = new Image();
			var result = new Promise(function (resolve, reject) {
				img.onload = function () {
					// It seem to be an unconfirmed issue with FF https://bugzilla.mozilla.org/show_bug.cgi?id=626613
					// when image onload event raises earlier than image has been fully loaded.
					// In ff background svg images are not rendered first time (before browser put it to cache)
					setTimeout(function () {
						resolve(img);
					}, 0);
				};
				img.onerror = function () {
					reject(this);
				};
			});
			img.src = dataUri;
			return result;
		});
	};

	return new DomToSVG();
});
