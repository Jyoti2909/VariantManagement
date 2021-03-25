VC.Utils.Page.LoadModules([
	'Toolbar/BasicTextBox',
	'Toolbar/NumberTextBoxBase'
]);

dojo.setObject(
	'VC.Toolbar.BasicNumberTextBox',
	dojo.declare([VC.Toolbar.BasicTextBox, VC.Toolbar.NumberTextBoxBase], {})
);
