const { wire } = HyperHTMLElement;

const vaultRegExp = /vault:\/\/\/\?fileid=/i;

const checkAllSVGsLoaded = (icons, loadedUrls) => {
	return icons.every((iconUrl) => loadedUrls.has(iconUrl));
};

const combineBackgroundImages = (images) => {
	return images.map((image) => `url("${image}")`).join(',');
};

const getImageParams = (icon, overlayIcons) => {
	if (overlayIcons.length === 0) {
		return { src: icon, style: null };
	}

	const images = [icon, ...overlayIcons];
	const src = images.pop();
	const backgroundImage = combineBackgroundImages(images);
	const style = {
		backgroundImage,
		backgroundSize: 'cover'
	};

	return { src, style };
};

const isVaultImage = (url) => vaultRegExp.test(url);

const setVaultImageBackground = async (node, fileId, overlayIcons) => {
	const vaultIcon = await SvgManager._vaultPromises.get(fileId);
	const { src, style } = getImageParams(vaultIcon, overlayIcons);
	node.src = src;
	Object.assign(node.style, style);

	return node;
};

const SvgManager = {
	loadedUrls: new Set(),
	vaultImages: new Map(),
	_enqueuedUrls: new Set(),
	_salt: 'svg-',
	_vaultPromises: new Map(),

	init: function () {
		if (this.dom) {
			return;
		}

		const svgNS = 'http://www.w3.org/2000/svg';
		const symbolContainer = document.createElementNS(svgNS, 'svg');
		symbolContainer.setAttribute('id', 'svg-symbols');
		symbolContainer.setAttribute('style', 'display:none');

		document.body.appendChild(symbolContainer);
		this.dom = symbolContainer;
	},

	createHyperHTMLNode: function (icon, options = {}) {
		if (!icon) {
			return null;
		}

		const { alt, class: cssClasses = null, overlayIcons = [] } = options;
		const icons = [icon, ...overlayIcons];

		this._preloadEnqueuedUrls(icons);
		const allSvgIconsLoaded = checkAllSVGsLoaded(icons, this.loadedUrls);
		if (allSvgIconsLoaded) {
			const altNode = alt ? wire(null, 'svg')`<title>${alt}</title>` : null;
			const useNodes = icons.map((url) => {
				const href = `#${this.getSymbolId(url)}`;
				return wire(null, 'svg')`<use href="${href}" />`;
			});

			return wire(null, 'svg')`
				<svg class="${cssClasses}">
					${altNode}
					${useNodes}
				</svg>
			`;
		}

		const fileId = icon.replace(vaultRegExp, '');
		const vaultImage = this.vaultImages.get(fileId);
		if (!isVaultImage(icon) || vaultImage) {
			const { src, style } = getImageParams(vaultImage || icon, overlayIcons);

			return wire()`
				<img
					class="${cssClasses}"
					src="${src}"
					alt="${alt}"
					style="${style}"
				/>
			`;
		}

		const imageNode = wire()`<img class="${cssClasses}" alt="${alt}" />`;
		if (!this._vaultPromises.has(fileId)) {
			this.load([icon]);
		}

		setVaultImageBackground(imageNode, fileId, overlayIcons);

		return imageNode;
	},

	createInfernoVNode: function (icon, options = {}) {
		if (!icon) {
			return null;
		}

		const {
			alt = null,
			attrs,
			class: cssClasses = null,
			overlayIcons = []
		} = options;
		const icons = [icon, ...overlayIcons];

		this._preloadEnqueuedUrls([icon]);
		const allSvgIconsLoaded = checkAllSVGsLoaded(icons, this.loadedUrls);
		if (allSvgIconsLoaded) {
			const altNode = alt ? <title>{alt}</title> : null;
			const useNodes = icons.map((url) => {
				const id = this.getSymbolId(url);
				const href = `#${id}`;
				return <use href={href} />;
			});
			return (
				<svg className={cssClasses} {...attrs}>
					{altNode}
					{useNodes}
				</svg>
			);
		}

		const fileId = icon.replace(vaultRegExp, '');
		const vaultImage = this.vaultImages.get(fileId);
		if (!isVaultImage(icon) || vaultImage) {
			const { src, style } = getImageParams(vaultImage || icon, overlayIcons);
			return (
				<img
					alt={alt}
					className={cssClasses}
					src={src}
					style={style}
					{...attrs}
				/>
			);
		}

		let ref = null;
		const refPromise = new Promise((resolve) => {
			ref = function (dom) {
				if (dom) {
					resolve(dom);
				}
			};
		});

		if (!this._vaultPromises.has(fileId)) {
			this.load([icon]);
		}

		refPromise.then((imageNode) =>
			setVaultImageBackground(imageNode, fileId, overlayIcons)
		);

		return (
			<img
				className={cssClasses}
				src="../images/DefaultItemType.svg"
				alt={alt}
				ref={ref}
				{...attrs}
			/>
		);
	},

	getSymbolId: function (url) {
		const id = this._urlToId(url);
		return this.loadedUrls.has(url) ? this._salt + id : null;
	},

	load: function (symbolUrlsArr = []) {
		const self = this;
		let requiredUrls = this._filterMissingUrls(symbolUrlsArr);
		if (this._enqueuedUrls.size !== 0) {
			requiredUrls = [...requiredUrls, ...this._enqueuedUrls];
			this._enqueuedUrls.clear();
		}

		const vaultUrls = new Set();
		symbolUrlsArr
			.filter(function (url) {
				const fileId = url.replace(vaultRegExp, '');
				return isVaultImage(url) && !self.vaultImages.has(fileId);
			})
			.forEach((url) => {
				vaultUrls.add(url);
			});
		if (!requiredUrls.length && !vaultUrls.size) {
			return Promise.resolve();
		}
		this.init();
		requiredUrls.forEach(function (url) {
			self.loadedUrls.add(url);
		});
		const requiredPromise = new Promise(function (resolve, reject) {
			const query = requiredUrls
				.map(function (url) {
					return encodeURI(self._urlToId(url));
				})
				.join(',');
			const request = new XMLHttpRequest();
			request.onload = function () {
				if (request.responseText) {
					const parser = new DOMParser();
					const tempDocument = parser.parseFromString(
						request.responseText,
						'text/html'
					);
					const tempFragment = document.createDocumentFragment();
					const symbols = tempDocument.firstChild.childNodes;
					for (let i = 0; i < symbols.length; i++) {
						tempFragment.appendChild(symbols[i].cloneNode(true));
					}
					self.dom.appendChild(tempFragment);
				}
				resolve();
			};
			request.onerror = function () {
				reject(new Error(`(${request.status}) ${request.statusText}`));
			};
			request.open(
				'GET',
				aras.getBaseURL() + '/javascript/include.aspx?svg=' + query,
				true
			);
			request.send();
		});

		if (!vaultUrls.size) {
			return requiredPromise;
		}
		const headers = aras.OAuthClient.getAuthorizationHeader();
		vaultUrls.forEach((url) => {
			const fileId = url.replace(vaultRegExp, '');
			try {
				url = aras.IomInnovator.getFileUrl(fileId, aras.Enums.UrlType.None);
			} catch (error) {
				if (error.message.startsWith('Error getting files:')) {
					return;
				} else {
					throw error;
				}
			}
			const promise = fetch(url, { headers: headers }).then((response) =>
				response.blob().then((blob) => {
					return new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result);
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					}).then((dataUrl) => {
						self.vaultImages.set(fileId, dataUrl);
						self._vaultPromises.delete(fileId);
						return dataUrl;
					});
				})
			);

			self._vaultPromises.set(fileId, promise);
		});

		const vaultPromise = Promise.all(this._vaultPromises);

		return Promise.all([requiredPromise, vaultPromise]);
	},

	enqueue(urls = []) {
		const urlsToEnqueue = this._filterMissingUrls(urls);
		urlsToEnqueue.forEach((url) => this._enqueuedUrls.add(url));
	},

	_filterMissingUrls(urls = []) {
		return urls.filter((url) => {
			const imageUrl = url.match(/\.\.\/images\/(?!.+\/).+\.svg/i);
			const urlEnqueued = this._enqueuedUrls.has(url);
			const urlLoaded = this.loadedUrls.has(url);
			return imageUrl && !urlEnqueued && !urlLoaded;
		});
	},

	_preloadEnqueuedUrls(urls = []) {
		if (this._enqueuedUrls.size === 0) {
			return;
		}

		const needToLoad = urls.some((url) => this._enqueuedUrls.has(url));
		if (needToLoad) {
			this.load();
		}
	},

	_urlToId: function (url) {
		return url
			.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))
			.toLowerCase();
	}
};

export default SvgManager;
