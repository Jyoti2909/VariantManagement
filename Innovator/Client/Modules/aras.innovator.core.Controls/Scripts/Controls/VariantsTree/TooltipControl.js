define('Controls/VariantsTree/TooltipControl', [
	'dojo/_base/declare',
	'Controls/Common/RenderUtils'
], function (declare, RenderUtils) {
	return declare('Controls.Tooltip', null, {
		isActive: false,
		tooltipData: null,
		domNode: null,
		contentType: null,
		_showTimer: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this.contentType = initialParameters.contentType || 'default';
			this._createDomNode(initialParameters.containerNode);
		},

		_createDomNode: function (containerNode) {
			var tooltipNode;

			containerNode = containerNode || document.body;
			tooltipNode = containerNode.ownerDocument.createElement('div');
			tooltipNode.setAttribute('class', 'tooltipControl');
			containerNode.appendChild(tooltipNode);

			this.domNode = tooltipNode;
		},

		wrapInTag: RenderUtils.HTML.wrapInTag,

		showTooltip: function (tooltipData) {
			if (tooltipData) {
				if (!this.isActive) {
					this._cleanupTimer();

					this._showTimer = setTimeout(
						function () {
							this.tooltipData = tooltipData;
							this._renderTooltip();

							this.domNode.style.left = this.tooltipData.positionX + 'px';
							this.domNode.style.top = this.tooltipData.positionY + 'px';
							this.domNode.classList.add('active');

							this._showTimer = null;
							this.isActive = true;
						}.bind(this),
						500
					);
				} else {
					this._renderTooltip();
				}
			} else {
				this.hideTooltip();
			}
		},

		hideTooltip: function () {
			if (this.isActive) {
				this.tooltipData = null;
				this.domNode.classList.remove('active');

				this.isActive = false;
			} else {
				this._cleanupTimer();
			}
		},

		_cleanupTimer: function () {
			if (this._showTimer) {
				clearTimeout(this._showTimer);
				this._showTimer = null;
			}
		},

		_renderTooltip: function () {
			var dataItems = this.tooltipData.tooltipItems;
			var tooltipContent = '';
			var rowCssClasses;
			var rowContent;
			var rowData;
			var rowLabel;
			var i;

			for (i = 0; i < dataItems.length; i++) {
				rowData = dataItems[i];

				if (rowData) {
					rowContent = '';
					rowCssClasses =
						'tooltipRow' + (rowData.cssClass ? ' ' + rowData.cssClass : '');
					rowData = typeof rowData == 'object' ? rowData : { value: rowData };

					if (rowData.value) {
						switch (this.contentType) {
							case 'labeled':
								rowLabel =
									(typeof rowData == 'string' ? '' : rowData.label) || '';

								rowContent += this.wrapInTag(rowLabel, 'span', {
									class: rowLabel ? 'rowLabel' : 'rowLabelEmpty'
								});
								rowContent += this.wrapInTag(rowData.value, 'span', {
									class: 'rowValue'
								});

								rowCssClasses += ' tooltipLabeledRow';
								break;
							default:
								rowContent += this.wrapInTag(rowData.value, 'span', {
									class: 'rowValue'
								});
								break;
						}
					}

					if (rowContent) {
						tooltipContent += this.wrapInTag(rowContent, 'div', {
							class: rowCssClasses
						});
					}
				}
			}

			this.domNode.innerHTML = tooltipContent;

			// at this moment all rowNodes already exist in DOM
			switch (this.contentType) {
				case 'labeled':
					// normalize tooltipRow height because label can be higher than value, but it's not affect row height due to css position 'absolute'
					if (tooltipContent) {
						var rowNodes = this.domNode.querySelectorAll('.tooltipRow');
						var maxLabelWidth = 0;
						var rowNode;
						var labelNode;
						var valueNode;

						for (i = 0; i < rowNodes.length; i++) {
							rowNode = rowNodes[i];
							labelNode = rowNode.firstChild;

							if (labelNode.offsetHeight > rowNode.offsetHeight) {
								rowNode.style.height = labelNode.offsetHeight + 'px';
							}

							maxLabelWidth = Math.max(maxLabelWidth, labelNode.offsetWidth);
						}

						for (i = 0; i < rowNodes.length; i++) {
							rowNode = rowNodes[i];
							labelNode = rowNode.firstChild;
							labelNode.style.width = maxLabelWidth + 'px';

							valueNode = labelNode.nextSibling;
							valueNode.style.marginLeft = maxLabelWidth + 10 + 'px';
						}
					}
					break;
				default:
					break;
			}
		}
	});
});
