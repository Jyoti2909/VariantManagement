var CuiTooltip = (function () {
	function CuiTooltip() {}

	/**
	* parse tooltipTemplate (e.g. 'File ${File:@type} ${SecureMessageMarkup:markup_data(//page)}
	* from ${ItemType:label} ${Item:keyed_name}') and replace special properties.

	* @param {string} tooltipTemplate - can be whether template or just plain text.
	*/
	CuiTooltip.prototype._getTooltipFromTooltipTemplate = function getTooltipFromTooltipTemplate(
		tooltipTemplate
	) {
		var re = /\${[\w]+:@?[\w_]+}/g;
		var matches = tooltipTemplate.match(re);
		if (!matches) {
			return tooltipTemplate;
		}

		var topWnd = aras.getMostTopWindowWithAras();
		for (var i = 0; i < matches.length; i++) {
			var currentMatch = matches[i].replace(/[{}$]/g, '').split(':');
			var itemTypeName = currentMatch[0];
			var propertyName = currentMatch[1];

			var item;
			switch (itemTypeName) {
				case 'ItemType':
					item = topWnd.itemType;
					break;
				case 'Item':
					if (topWnd.item && topWnd.item.xml) {
						item = topWnd.item;
						if (aras.isNew(item)) {
							//set static tooltip instead of template when item is new
							return null;
						}
					}
					break;
			}

			var replacement;
			if (item) {
				if (propertyName.charAt(0) === '@') {
					//it's attribute
					replacement = item.getAttribute(propertyName.replace('@', '')) || ''; //set empty string if attribute of item does not exist
				} else {
					var propertyNode = item.selectSingleNode(propertyName);
					replacement = propertyNode === null ? '' : propertyNode.text; //set empty string if property of item does not exist or we haven't access to it
				}
			} else {
				replacement = aras.getResource(
					undefined,
					'cui.tooltip_template_unavailable'
				); //set '[unavailable]' if user tries to get property of unsupported itemType
			}

			tooltipTemplate = tooltipTemplate.replace(matches[i], replacement);
		}
		return tooltipTemplate;
	};

	/**
	* Adds dojo's tooltip to button (widget).

	* @param {widgetId} id of button-widget to which a tooltip will be added.
	* @param {tooltipData} additionalData with properties for a tooltip.
	*/
	CuiTooltip.prototype.setTooltip = function (widgetId, tooltipData) {
		var tooltipWidget = dijit.byId(widgetId + '_tooltip');
		if (tooltipWidget) {
			//remove tooltip for widget if it exsists before create new
			tooltipWidget.destroy();
		}

		dijit.byId(widgetId).set('title', ''); //disable standard tooltip
		var self = this;
		require(['dijit/Tooltip'], function (Tooltip) {
			new Tooltip({
				id: widgetId + '_tooltip',
				connectId: [widgetId],
				getContent: function () {
					var tooltipTemplate = this.tooltipData.template;
					if (tooltipTemplate !== undefined && tooltipTemplate !== null) {
						this.label = self._getTooltipFromTooltipTemplate(tooltipTemplate);
						if (this.label === null) {
							this.label = this.tooltipData.label;
						}
					} else {
						this.label = this.tooltipData.label;
					}

					return this.label;
				},
				tooltipData: tooltipData
			});
		}.bind(this));
	};

	CuiTooltip.prototype.makeOnClickHandlerForCommandBarMenu = function (
		tooltipWidget
	) {
		return function () {
			tooltipWidget.close();
		};
	};

	CuiTooltip.prototype.makeOnShowHandlerForCommandBarMenuTooltip = function (
		widget,
		tooltipWidget
	) {
		return function () {
			if (widget.dropDown.activated) {
				tooltipWidget.close();
			}
		};
	};

	return CuiTooltip;
})();
