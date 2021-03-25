/*jslint sloppy: true, nomen: true*/
/*global dojo, define, document, window*/
define([
	'dojo/_base/declare',
	'dijit/form/ToggleButton',
	'./_ToolbarButtonMixin'
], function (declare, ToggleButton, _ToolbarButtonMixin) {
	return declare(
		'Aras.Client.Controls.Experimental._toolBar.ToggleButton',
		[ToggleButton, _ToolbarButtonMixin],
		{}
	);
});
