require([
	'dojo/ready',
	'ES/Scripts/Classes/Dialog/AddPropertiesDialog'
], function (ready, AddPropertiesDialog) {
	ready(function () {
		new AddPropertiesDialog(window.frameElement.dialogArguments);
	});
});
