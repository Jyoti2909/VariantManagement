/* global define */
define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry'
], function (declare, TooltipDialog, on, keys, CellEditorBase) {
	var valueToReturn;

	return declare(CellEditorBase, {
		show: function (cell, onCellEditorClosed) {
			const aras = parent.aras;
			return aras.vault.selectFile().then(function (file) {
				const selectedFile = aras.newItem('File', file);
				if (selectedFile) {
					aras.itemsCache.addItem(selectedFile);
					aras.saveItemEx(selectedFile);
					const xmldom = aras.createXMLDocument();
					xmldom.loadXML(selectedFile.xml);
					const id = xmldom.selectSingleNode('Item').getAttribute('id');
					valueToReturn = id;
					onCellEditorClosed();
				} else {
					valueToReturn = '';
					onCellEditorClosed();
				}
			});
		},

		getValue: function () {
			return valueToReturn;
		}
	});
});
