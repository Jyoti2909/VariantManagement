var CuiUtils = (function () {
	function Utils() {
		// Instance of ArrayListComparer should be created from main winodow because IOM is not included to Tear-off
		var mainWnd = aras.getMainWindow();
		this.arrayListComparer = new mainWnd.Aras.IOME.ArrayListComparer();
	}

	Utils.prototype.getDefaultContextItem = function () {
		return {
			itemType: window.itemType,
			itemID: window.itemID,
			item: window.item
		};
	};

	Utils.prototype.evalCommandBarItemMethod = function (
		methodId,
		contextItem,
		dontConvertParams,
		contextParams
	) {
		// todo: not sure that dontConvertParams is necessary
		if (!methodId) {
			throw 'methodId undefined';
		}
		var inArgs = dontConvertParams
			? contextItem
			: this.createClientMethodParams(contextItem);
		if (contextParams) {
			inArgs.contextParams = contextParams;
		}
		return aras.evalMethod(methodId, '', inArgs);
	};

	Utils.prototype.createClientMethodParams = function (contextItem) {
		var params = Object.assign({}, contextItem); // copy contextParams to params
		if (contextItem.itemID) {
			params.itemId = contextItem.itemID;
		}
		if (contextItem.itemType) {
			params.itemTypeId = contextItem.itemType.getAttribute('id');
		}
		return params;
	};

	Utils.prototype.noItems = function (items) {
		return !items || items.length < 1 ? true : false;
	};

	Utils.prototype.format = function () {
		var args = arguments;
		return args[0].replace(/{(\d+)}/g, function (match, number) {
			var num = parseInt(number) + 1;
			return typeof args[num] !== 'undefined' ? args[num] : '';
		});
	};

	Utils.prototype.getCommandBarItemAdditionalData = function (
		item,
		initHandlerResult
	) {
		var initData = item.selectSingleNode('additional_data');
		initData = initData ? initData.text : '';
		return this._getCommandBarItemAdditionalData(initData, initHandlerResult);
	};

	Utils.prototype._getCommandBarItemAdditionalData = function (
		initData,
		initHandlerResult
	) {
		if (initData) {
			initData = JSON.parse(initData);
		}

		if (initData) {
			if (initHandlerResult) {
				initData = Object.assign(initData, initHandlerResult);
			}
		} else {
			initData = initHandlerResult;
		}
		return initData;
	};

	Utils.prototype.applyAdditionalData = function (widget, data, noDataProps) {
		if (data) {
			var standardAdditionalDataProps = [
				'cui_style',
				'cui_class',
				'cui_visible',
				'cui_base_class'
			];
			var domNode = widget.domNode || widget['_item_Experimental'].domNode;
			if (data['cui_style']) {
				domNode.setAttribute(
					'style',
					domNode.getAttribute('style') + '; ' + data['cui_style']
				);
			}

			var classes = data['cui_class'];
			if (classes) {
				classes.split(' ').forEach(function (className) {
					if (!className.match(/^\s*$/)) {
						domNode.classList.add(className);
					}
				});
			}

			if (!noDataProps) {
				for (var prop in data) {
					if (
						data.hasOwnProperty(prop) &&
						standardAdditionalDataProps.indexOf(prop) < 0
					) {
						widget.set(prop, data[prop]);
					}
				}
			}
		}
		return data;
	};

	Utils.prototype.getHandlerName = function (
		item,
		additionalData,
		handlerName
	) {
		return (
			aras.getItemPropertyAttribute(item, handlerName, 'keyed_name') ||
			(additionalData ? additionalData[handlerName] : null)
		);
	};

	Utils.prototype.getOnInitHandlerName = function (item) {
		return this.getHandlerName(item, null, 'on_init_handler');
	};

	Utils.prototype.getOnClickHandler = function (item) {
		var methodId = this.getHandlerName(item, null, 'on_click_handler');
		var self = this;
		var evalOnClickHandler = function evalOnClickHandler(methodParams) {
			self.evalCommandBarItemMethod(methodId, methodParams);
		}.bind(this);

		return methodId ? evalOnClickHandler : null;
	};

	Utils.prototype.prepareInitHandlers = function (items) {
		var initHandlers = {};
		var currentItem;
		var methodId;
		for (var i = 0; i < items.length; i++) {
			currentItem = items[i];
			var id = currentItem.getAttribute('id');
			methodId = currentItem.selectSingleNode('on_init_handler');
			methodId = methodId ? methodId.text : '';
			if (methodId) {
				var methodNd = aras.MetadataCache.GetClientMethodNd(methodId, 'id');
				if (methodNd) {
					/* jshint ignore:start */
					initHandlers[id] = new Function(
						'control, inArgs',
						methodNd.selectSingleNode('method_code').text
					);
					/* jshint ignore:end */
				}
			}
		}
		return initHandlers;
	};

	Utils.prototype._mapExtraControlPropsToXml = function (props) {
		//'if (!props)' is kept for backward compatibility
		if (!props) {
			return '';
		}

		var extras = ' ';
		var propsKeys = Object.keys(props);
		for (var i = 0; i < propsKeys.length; i++) {
			var propValue = props[propsKeys[i]];
			if (propValue !== undefined) {
				extras += this.format(
					'{0}="{1}" ',
					propsKeys[i],
					this._escapeXMLAttribute(propValue)
				);
			}
		}

		return extras.trim();
	};

	Utils.prototype._escapeXMLAttribute = function (val) {
		return val.replace ? aras.escapeXMLAttribute(val) : val;
	};

	Utils.prototype.getHashCode = function (str) {
		var hash = 0;
		if (typeof str !== 'string' || str.length === 0) {
			return hash;
		}
		hash = this.arrayListComparer.getHashCode([str]);
		// In original implementation method return 'hash'. In that case 'hash' can be negative.
		// Return result is changed to '(hash >>> 0)'. It's allows to avoid negative results.
		return hash >>> 0;
	};

	Utils.prototype.getParentMenuId = function (item) {
		const parenMenuNode = item && item.selectSingleNode('parent_menu');
		return parenMenuNode && parenMenuNode.text;
	};

	return Utils;
})();
