define([
	'dojo/_base/declare',
	'./TooltipDialogUtils',
	'dojo/domReady!'
], function (declare, TooltipDialogUtils) {
	return declare(null, {
		tooltipDialogUtils: null,

		_lastSelectedTemplateElementName: null,
		_fieldName: null,

		constructor: function () {
			this.tooltipDialogUtils = new TooltipDialogUtils({ aras: aras });
		},

		startup: function () {
			var tooltipDialog = this.tooltipDialogUtils.getCurrentTooltipDialog();
			if (tooltipDialog) {
				tooltipDialog.templateHelper = this;
				this._fieldName = tooltipDialog._fieldName;
			}
			var dataStore = [];
			var aliasesAndCellTemplateValues =
				(tooltipDialog && tooltipDialog.getQbCellTemplateValuesByAlias()) || {};
			var aliasAndCellTemplateValues;
			var i;
			var j;
			for (i in aliasesAndCellTemplateValues) {
				if (!aliasesAndCellTemplateValues.hasOwnProperty(i)) {
					continue;
				}
				aliasAndCellTemplateValues = aliasesAndCellTemplateValues[i];
				for (j = 0; j < aliasAndCellTemplateValues.length; j++) {
					dataStore.push('{' + i + '.' + aliasAndCellTemplateValues[j] + '}');
				}
			}
			dataStore = dataStore.sort(function (a, b) {
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			});
			var selectElement = this._getHtmlElementByFieldName('template_helper');
			var option;
			for (i = 0; i < dataStore.length; i++) {
				option = document.createElement('option');
				option.text = dataStore[i];
				selectElement.add(option);
			}
		},

		_getHtmlElementByFieldName: function (fieldName) {
			var elements = document.getElementsByName(fieldName);
			var element;
			var i;
			for (i in elements) {
				if (!elements.hasOwnProperty(i)) {
					continue;
				}
				element = elements[i];
				if (element.name === fieldName) {
					return element;
				}
			}
		},

		setLastSelectedTemplateElementName: function (name) {
			this._lastSelectedTemplateElementName = name;
		},

		appendTemplate: function (value) {
			//logic to append to lastSelectedTemplateElement (it should be item_id_template, text_template, list_value_template or icon_template)
			var templateElement;
			var fieldNameIdTemplate = 'item_id_template';
			var fieldNameIconTemplate = 'icon_template';
			if (
				this._lastSelectedTemplateElementName === fieldNameIdTemplate ||
				this._lastSelectedTemplateElementName === fieldNameIconTemplate
			) {
				templateElement = this._getHtmlElementByFieldName(
					this._lastSelectedTemplateElementName
				);
			}
			var fieldNameTextTemplate =
				this._fieldName ||
				(document.thisItem.getProperty('cell_view_type') === 'List'
					? 'list_value_template'
					: 'text_template');
			if (!templateElement) {
				templateElement = this._getHtmlElementByFieldName(
					fieldNameTextTemplate
				);
			}
			switch (templateElement.tagName.toUpperCase()) {
				case 'INPUT':
				case 'TEXTAREA':
					var currentValue = document.thisItem.getProperty(
						templateElement.name,
						''
					);
					var valueToSet = currentValue + value;
					handleItemChange(templateElement.name, valueToSet);
					break;
				default:
					console.log("such template element tagName isn't supported");
					break;
			}
			templateElement.focus();
		}
	});
});
