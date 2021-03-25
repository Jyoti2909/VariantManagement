define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry',
	'dijit/form/ComboBox',
	'dojo/domReady!'
], function (declare, TooltipDialog, on, keys, CellEditorBase, registry) {
	var inputId = 'dateCellEditorInput';
	var aras;
	var innovatorDatePattern = 'short_date';
	var format;
	var dojoEditor;

	function convertFromNeutral(value, datePattern) {
		if (!value) {
			return '';
		}
		if (datePattern !== null && datePattern !== '') {
			format = aras.getDotNetDatePattern(datePattern);
		}
		return aras.convertFromNeutral(value, 'date', format);
	}

	function convertToNeutral(value) {
		if (!value) {
			return '';
		}

		return aras.convertToNeutral(value, 'date', format);
	}

	return declare(CellEditorBase, {
		constructor: function (arasObj) {
			aras = arasObj;
			format = aras.getDotNetDatePattern(innovatorDatePattern);
			this.tooltipDialog = new TooltipDialog({ id: 'dateCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			var cellValue = cell.element.textContent;

			this.tooltipDialog.set(
				'content',
				"<div style='white-space: nowrap;'><input data-dojo-type='dijit/form/ComboBox' id='" +
					inputId +
					"' style='width: 120px;' value='" +
					cellValue +
					'\'><div id="showCalendarButton" class="calendar"></div></div>'
			);

			this.inherited(arguments); //popup.open

			dojoEditor = registry.byId(inputId);

			//disable browser's menu, e.g., on RMB click.
			dojoEditor.domNode.parentElement.parentElement.parentElement.parentElement.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			dojoEditor.textbox.focus();
			dojoEditor.textbox.select();

			dojoEditor.onSearch = function () {
				//overrided to skip validation after each text changed.
			};

			dojoEditor.loadDropDown = function () {
				var param = {
					date: aras.convertFromNeutral(
						dojoEditor.textbox.value,
						'date',
						format
					),
					format: format,
					aras: aras,
					type: 'Date'
				};
				var topWnd = aras.getMostTopWindowWithAras(window);
				var wndRect = aras.uiGetElementCoordinates(dojoEditor.textbox);
				this.hideOnBlur = false;
				var dateDialog = (topWnd.main || topWnd).ArasModules.Dialog.show(
					'iframe',
					param
				);
				dateDialog.move(
					wndRect.left - wndRect.screenLeft,
					wndRect.top - wndRect.screenTop
				);
				dateDialog.promise.then(function (newDate) {
					if (newDate !== undefined) {
						dojoEditor.textbox.value = newDate;
						this.hideOnBlur = true;
						onCellEditorClosed();
					}
				});
			};

			on(
				document.getElementById('showCalendarButton'),
				'click',
				dojoEditor.loadDropDown.bind(this)
			);

			var self = this;

			var handler = on(dojoEditor.textbox, 'keydown', function (event) {
				switch (event.keyCode) {
					case keys.ENTER:
						if (!self.isValueValid()) {
							dojoEditor.state = 'Error';
							dojoEditor.set('message', aras.ValidationMsg);
						} else {
							onCellEditorClosed();
						}
						break;
					case keys.ESCAPE:
						onCellEditorClosed(true);
						break;
					case keys.F2:
						dojoEditor.loadDropDown.apply(self);
						break;
					case keys.TAB:
						if (self.isValueValid()) {
							onCellEditorClosed(false, true);
						}
						break;
				}
			});
			this.handlers.push(handler);
		},

		formatter: function (value) {
			return convertFromNeutral(value, this.datePattern);
		},

		isValueValid: function () {
			return aras.isPropertyValueValid(
				{ data_type: 'date', pattern: format },
				dojoEditor.textbox.value
			);
		},

		getValue: function () {
			return convertToNeutral(dojoEditor.textbox.value);
		}
	});
});
