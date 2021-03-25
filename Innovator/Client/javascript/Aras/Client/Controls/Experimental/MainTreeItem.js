define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.Experimental.MainTreeItem', null, {
		id: null,
		label: null,
		openIcon: null,
		closedIcon: null,
		userdata: null,
		action: null,
		open: null,
		children: null,
		iconsMultiple: null,

		constructor: function (
			id,
			label,
			openIcon,
			closedIcon,
			userdata,
			action,
			iconsMultiple
		) {
			this.id = id;
			this.label = label;
			this.openIcon = openIcon;
			this.closedIcon = closedIcon;
			this.userdata = userdata;
			this.action = action;
			this.open = false;
			this.children = [];
			this.iconsMultiple = iconsMultiple ? iconsMultiple.split(';') : null;
		}
	});
});
