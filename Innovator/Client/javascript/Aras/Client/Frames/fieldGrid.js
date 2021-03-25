/*global define*/
/*jslint nomen: true*/
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Aras/Client/Controls/Public/GridContainer'
], function (declare, connect, GridContainer) {
	'use strict';
	return declare('Aras.Client.Frames.fieldGrid', null, {
		grid: null,
		aras: null,
		currFldNode: null, //node of field wich properties are shown
		currFldID: null, //correspondent id

		constructor: function (aras) {
			this.aras = aras;
			var grid = new GridContainer(),
				formName = this.aras.getNodeElement(currFormNd, 'name');

			connect.connect(grid, 'gridClick', this, this.onSelectGridRow);
			grid.setLayout_Experimental([
				{
					field: 'img',
					name: ' ',
					width: '30px',
					styles: 'text-align: center;',
					headerStyles: 'text-align: center;',
					formatter: grid.formatter_Experimental.img
				},
				{
					field: 'fields',
					name: this.aras.getResource(
						'',
						'fieldtool.form_fields',
						"'" + formName + "'"
					),
					width: '100%',
					styles: 'text-align: left;',
					headerStyles: 'text-align: center;'
				}
			]);
			this.grid = grid;
			this.populateGrid();
		},

		onSelectGridRow: function (rowID, col, scrollIntoView) {
			if (scrollIntoView === undefined) {
				scrollIntoView = true;
			}

			if (this.currFldID) {
				this.unSelectField(this.currFldID);
			}

			var tabs = document.getElementById('tabs').contentWindow,
				spanElem,
				canvas = document.getElementById('canvas').contentWindow,
				properties = document.getElementById('properties').contentWindow,
				isFieldTab =
					tabs.currTabID.search(/^field/) === 0 ||
					tabs.currTabID === this.aras.getRelationshipTypeId('Field Event'),
				refreshFlg = this.currFldID !== rowID && isFieldTab;

			this.currFldID = rowID;
			this.currFldNode = currBodyNd.selectSingleNode(
				"Relationships/Item[@type='Field' and @id='" + this.currFldID + "']"
			);

			this.selectField(this.currFldID, 'black');

			if (scrollIntoView) {
				spanElem = canvas.document.getElementById(this.currFldID + 'span');
				if (spanElem) {
					spanElem.scrollIntoView(false);
				}
			}

			if (refreshFlg) {
				if (tabs.currTabID === this.aras.getRelationshipTypeId('Field Event')) {
					tabs.onFieldTabSelect(
						this.aras.getRelationshipTypeId('Field Event'),
						false
					);
				} else {
					if (properties.document.forms.MainDataForm) {
						this.aras.uiPopulateFormWithItemEx(
							properties.document.forms.MainDataForm,
							this.currFldNode,
							properties.document.itemType,
							isEditMode
						);
						if (
							tabs.currTabID === 'fieldType' ||
							tabs.currTabID === 'fieldPhysical' ||
							aras.getItemProperty(this.currFldNode, 'field_type') ===
								'xclasses'
						) {
							tabs.onFieldTabSelect(tabs.currTabID, true);
						}
					} else {
						tabs.onFieldTabSelect(tabs.currTabID, false);
					}
				}
			}
		},

		populateGrid: function () {
			var statusId = this.aras.showStatusMessage(
					'status',
					this.aras.getResource('', 'fieldtool.populating_fields_list'),
					''
				),
				fldType,
				i,
				l,
				fieldNds = currBodyNd.selectNodes(
					"Relationships/Item[@type='Field' and (not(@action) or (@action != 'delete' and @action != 'purge'))]"
				),
				arrayItems = [];
			for (i = 0, l = fieldNds.length; i < l; i += 1) {
				fldType = this.aras.getNodeElement(fieldNds[i], 'field_type');
				arrayItems.push({
					uniqueId: fieldNds[i].getAttribute('id'),
					img: this._getImgNameForFldType(fldType),
					fields: this.aras.getNodeElement(fieldNds[i], 'name')
				});
			}
			this.grid.setArrayData_Experimental(arrayItems);

			if (!this.currFldID && this.grid.getRowCount()) {
				this.currFldID = this.grid.getRowId(0);
			}
			if (this.currFldID) {
				this.currFldNode = currBodyNd.selectSingleNode(
					"Relationships/Item[@id='" + this.currFldID + "']"
				);
				this.grid.setSelectedRow(this.currFldID, 0, true);
			} else {
				this.currFldID = '';
				this.currFldNode = null;
			}

			this.aras.clearStatusMessage(statusId);
		},

		selectField: function (fieldID, borderColor) {
			borderColor = borderColor || 'black';
			var canvas = document.getElementById('canvas').contentWindow,
				spanElem = canvas.document.getElementById(fieldID + 'span');
			if (!spanElem) {
				return false;
			}
			spanElem.style.border = '1px dashed ' + borderColor;
		},

		emptyGrid: function () {
			this.grid.RemoveAllRows();
		},

		unSelectField: function (fieldID) {
			var canvas = document.getElementById('canvas').contentWindow,
				spanElem = canvas.document.getElementById(fieldID + 'span');
			if (!spanElem) {
				return false;
			}
			spanElem.style.border = '';
		},

		_getImgNameForFldType: function (fldType) {
			var res = '';
			switch (fldType) {
				case 'text':
					res = '../images/TextField.svg';
					break;
				case 'checkbox':
				case 'checkbox list':
					res = '../images/checkbox-checked.svg';
					break;
				case 'password':
				case 'textarea':
				case 'dropdown':
				case 'button':
				case 'color':
				case 'tree':
				case 'menubar':
				case 'toolbar':
				case 'grid':
				case 'treegrid':
				case 'image':
					res = '../images/' + fldType + '.svg';
					break;
				case 'listbox single select':
					res = '../images/ListBox.svg';
					break;
				case 'listbox multi select':
					res = '../images/ListBoxMulti.svg';
					break;
				case 'radio button list':
					res = '../images/RadioButton.svg';
					break;
				case 'date':
					res = '../images/BusinessCalendarYear.svg';
					break;
				case 'nested form':
					res = '../images/Form.svg';
					break;
				case 'file item':
					res = '../images/File.svg';
					break;
				case 'item':
					res = '../images/ItemType.svg';
					break;
				case 'javascript':
					res = '../images/TextField.svg';
					break;
			}
			return res;
		}
	});
});
