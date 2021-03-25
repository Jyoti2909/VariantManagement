define(['Aras/Client/Controls/Public/GridContainer', 'dojo/aspect'], function (
	GridContainer,
	aspect
) {
	'use strict';
	const MacConditionGridInitializer = (function () {
		function MacConditionGridInitializer(connectId, gridController) {
			this.connectId = connectId;
			this.gridController = gridController;
			this.grid = new GridContainer({
				connectId: this.connectId
			});
			this.setLayout();
			this.grid.grid_Experimental.selection.mode = 'single';
			this.grid.grid_Experimental.render();
			this.createContextMenu();
			this.grid.grid_Experimental.noDataMessage = aras.getResource(
				'../Modules/aras.innovator.MacPolicy/',
				'condition_grid.empty_grid'
			);
		}
		MacConditionGridInitializer.prototype.setLayout = function () {
			const gridLayout = [
				{
					field: 'name',
					name: 'Name',
					width: '20%',
					styles: 'text-align: left;',
					headerStyles: 'text-align: center;'
				},
				{
					field: 'condition',
					name: 'Condition',
					width: '50%',
					styles: 'text-align: left;',
					headerStyles: 'text-align: center;',
					formatter: function (item, rowIndex, cell) {
						const store = cell.grid.store;
						item = store._arrayOfTopLevelItems[rowIndex];
						if (store.getValue(item, 'isError', true)) {
							return (
								'<span style="color:red">' +
								store.getValue(item, 'condition', true) +
								'</span>'
							);
						}
						return (
							'<span title="' +
							store.getValue(item, 'condition', true) +
							'">' +
							store.getValue(item, 'condition', true) +
							'</span>'
						);
					}
				},
				{
					field: 'description',
					name: 'Description',
					width: '30%',
					styles: 'text-align: left;',
					headerStyles: 'text-align: center;'
				},
				{
					field: 'isError',
					name: 'isError',
					hidden: true
				}
			];
			this.grid.setLayout_Experimental(gridLayout);
		};
		MacConditionGridInitializer.prototype.createContextMenu = function () {
			const contextMenu = [
				{
					id: 'Edit',
					name: aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_grid.contextmenu_edit'
					),
					checked: false
				},
				{
					id: 'View',
					name: aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_grid.contextmenu_view'
					),
					checked: false
				},
				{
					separator: true
				},
				{
					id: 'Remove',
					name: aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_grid.contextmenu_remove'
					),
					checked: false
				}
			];
			this.grid.contexMenu_Experimental.addRange(contextMenu);
			const self = this;
			aspect.after(
				this.grid.contexMenu_Experimental,
				'onItemClick',
				function (id, rowId) {
					self.gridController.contextMenuAction(id, rowId);
				},
				true
			);
		};
		return MacConditionGridInitializer;
	})();
	return MacConditionGridInitializer;
});
