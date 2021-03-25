VC.Utils.Page.LoadModules([
	'Toolbar/CommandTextBox',
	'Toolbar/NumberTextBoxBase'
]);

dojo.setObject(
	'VC.Toolbar.CommandNumberTextBox',
	dojo.declare([VC.Toolbar.CommandTextBox, VC.Toolbar.NumberTextBoxBase], {})
);
