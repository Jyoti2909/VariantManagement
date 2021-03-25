/*jslint sloppy: true, nomen: true*/
/*global dojo, define, document, window*/
define([
	'dojo/_base/declare',
	'dijit/form/Button',
	'./_ToolbarButtonMixin'
], function (declare, Button, _ToolbarButtonMixin) {
	return declare(
		'Aras.Client.Controls.Experimental._toolBar.Button',
		[Button, _ToolbarButtonMixin],
		{}
	);
});
