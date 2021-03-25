require(['dojo/_base/declare', 'dojo/query', 'dojo/on'], function (
	declare,
	query,
	on
) {
	dojo.setObject(
		'Izenda.UI.Tab.Style',
		declare(Izenda.UI.Tab.Base, {
			init: function () {
				this.inherited(arguments);
				this.improveIzendaUI(this.tabContent);
			},

			improveIzendaUI: function (container) {
				//todo Move to Utils if it will be required more than once
				query('input', container).forEach(function (el, idx) {
					if (el.name.indexOf('_ItemsPerPage') != -1) {
						on(el, 'keydown, keyup, change', function (e) {
							if (
								[46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
								// Allow: Ctrl+A, Command+A
								(e.keyCode == 65 &&
									(e.ctrlKey === true || e.metaKey === true)) ||
								// Allow: Ctrl+C, Ctrl+V, Command+C, Command+V
								((e.keyCode == 67 || e.keyCode == 86) &&
									(e.ctrlKey === true || e.metaKey === true)) ||
								// Allow: home, end, left, right, down, up
								(e.keyCode >= 35 && e.keyCode <= 40)
							) {
								// let it happen, don't do anything
								return;
							}
							// Ensure that it is a number and stop the keypress
							if (
								(e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
								(e.keyCode < 96 || e.keyCode > 105)
							) {
								e.preventDefault();
							}
							var num = parseInt(e.target.value);
							if (num > 5000) {
								e.preventDefault();
								e.target.value = 5000;
							}
						});
					}
				});
			}
		})
	);
});
