ModulesManager.define(
	[],
	'aras.innovator.core.History/HistoryManager',
	function () {
		//args = { aras: ... }
		function HistoryManager(args) {
			var arasObj = args.aras;

			this.showItemHistory = function (itemNd) {
				var param = {};
				param.title = arasObj.getResource('', 'historygrid.item_history');
				param.formId = '8C2E17D224ED48DCB36CD3684973ECCE'; //History Container Form
				param.aras = arasObj;
				param.isEditMode = false;
				var configID = arasObj.getItemProperty(itemNd, 'config_id');
				if (!configID) {
					var item = arasObj.getItemById(
						itemNd.getAttribute('type'),
						arasObj.getItemProperty(itemNd, 'id'),
						0,
						null,
						'config_id'
					);
					configID = arasObj.getItemProperty(item, 'config_id');
				}
				var historyItm = arasObj.getItem(
					'History Container',
					"item_config_id='" + configID + "'",
					'<item_config_id>' + configID + '</item_config_id>',
					0
				);
				if (historyItm) {
					param.item = new Item('tmp', 'tmp');
					param.item.loadAML(historyItm.xml);
					var topWnd = arasObj.getMostTopWindowWithAras(window);
					param.content = 'ShowFormAsADialog.html';
					param.dialogHeight = 600;
					param.dialogWidth = 1000;
					(topWnd.main || topWnd).ArasModules.Dialog.show('iframe', param);
				} else {
					arasObj.AlertError(
						arasObj.getResource('', 'common.no_history_containers_found')
					);
				}
			};
		}

		return HistoryManager;
	}
);
