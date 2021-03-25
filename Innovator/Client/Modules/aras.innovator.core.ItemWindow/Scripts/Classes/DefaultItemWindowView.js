ModulesManager.define(
	[],
	'aras.innovator.core.ItemWindow/DefaultItemWindowView',
	function () {
		function getTabsState(arasObj, itemTypeNd) {
			let globalUserPref = arasObj.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_tabs_state'
			);
			globalUserPref =
				globalUserPref || arasObj.getItemProperty(itemTypeNd, 'structure_view');
			if (globalUserPref === 'tab view') {
				//backward compatibility with obsolete "tab view" value
				globalUserPref = 'tabs on';
			}
			if (
				globalUserPref &&
				['tabs off', 'tabs min', 'tabs max', 'tabs on'].indexOf(
					globalUserPref
				) === -1
			) {
				globalUserPref = 'tabs min';
			}
			return globalUserPref;
		}

		function DefaultItemWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;

			if (!inDom) {
				return;
			}

			const arasObj = aras;
			const itemTypeName = inDom.getAttribute('type');
			let showSSVCSidebar = false;
			if (inArgs.viewMode === 'new') {
				showSSVCSidebar = arasObj.isNeedToDisplaySSVCSidebar(inDom, 'add');
			} else {
				const isEditMode =
					arasObj.isTempEx(inDom) ||
					(arasObj.isLockedByUser(inDom) && arasObj.isEditStateEx(inDom));
				showSSVCSidebar = arasObj.isNeedToDisplaySSVCSidebar(
					inDom,
					isEditMode ? 'edit' : 'view'
				);
			}
			if (!showSSVCSidebar) {
				this.isSSVCEnabled = false;
				return;
			}

			const itemTypeNd = arasObj.getItemTypeNodeForClient(itemTypeName);
			if (!itemTypeNd) {
				arasObj.AlertError(
					arasObj.getResource(
						'',
						'ui_methods_ex.item_type_not_found',
						itemTypeName
					)
				);
				return null;
			}
			const discussionTemplates = itemTypeNd.selectSingleNode(
				"Relationships/Item[@type='DiscussionTemplate']"
			);
			if (discussionTemplates) {
				this.isSSVCEnabled = true;
				return;
			}

			const itemID = inDom.getAttribute('id');
			const itemConfigID = inDom.selectSingleNode('config_id');
			let checkSSVC = arasObj.IomInnovator.newItem(
				itemTypeName,
				'VC_IsSSVCEnabledForItem'
			);
			checkSSVC.setID(itemID);
			if (itemConfigID) {
				checkSSVC.setProperty('config_id', itemConfigID.text);
			}
			checkSSVC = checkSSVC.apply();
			const resultNode = checkSSVC.dom.selectSingleNode('//Result');

			this.isSSVCEnabled = resultNode && resultNode.text === 'true';
		}

		DefaultItemWindowView.prototype = {};

		DefaultItemWindowView.prototype.getWindowProperties = function () {
			const inArgs = this.inArgs;
			const itemNd = this.inDom;
			const arasObj = aras;
			const isNew = inArgs.viewMode === 'new';
			const itemTypeName = itemNd.getAttribute('type');
			const scrH = screen.availHeight;
			const scrW = screen.availWidth;
			const itemTypeNd = arasObj.getItemTypeNodeForClient(itemTypeName);
			if (!itemTypeNd) {
				arasObj.AlertError(
					arasObj.getResource(
						'',
						'ui_methods_ex.item_type_not_found',
						itemTypeName
					)
				);
				return null;
			}

			const state = getTabsState(arasObj, itemTypeNd);
			const isEditMode =
				arasObj.isTempEx(itemNd) ||
				(arasObj.isLockedByUser(itemNd) && arasObj.isEditStateEx(itemNd));
			const formType = isNew ? 'add' : isEditMode ? 'edit' : 'view';
			const formID = arasObj.uiGetFormID4ItemEx(itemNd, formType);
			const formNd = formID ? arasObj.getFormForDisplay(formID).node : null;
			let formH = formNd
				? parseInt(arasObj.getItemProperty(formNd, 'height'))
				: 50;
			const formW = formNd
				? parseInt(arasObj.getItemProperty(formNd, 'width'))
				: 784;

			//it's important to use "top" window here to get size of OS borders
			const topWindow = window;
			let winBorderH = Math.max(
				topWindow.outerHeight - topWindow.innerHeight,
				0
			);
			let winBorderW = Math.max(topWindow.outerWidth - topWindow.innerWidth, 0);
			if (topWindow === arasObj.getMainWindow()) {
				winBorderH += arasObj.browserHelper.getHeightDiffBetweenTearOffAndMainWindow();
			}

			//calculate window size based on a form size, window borders size and other components
			const winH =
				formH +
				winBorderH +
				55 /*menu*/ +
				23 /*status bar*/ +
				(state === 'tabs off' ? 0 : 230 + 6); /*relationships and splitter*/
			const winW = formW + winBorderW + (this.isSSVCEnabled ? 30 : 0); // TODO : SSVC sidebar size 30
			const x = Math.max((scrW - winW) / 2, 0);
			const y = Math.max((scrH - winH) / 2, 0);

			// otherElements = menu + toolbar + relationship grid + status bar;
			if (winH > scrH) {
				formH += scrH - winH;
			}

			return {
				height: winH,
				width: winW,
				x: x,
				y: y,
				formHeight: formH,
				formWidth: formW
			};
		};

		DefaultItemWindowView.prototype.getWindowArguments = function () {
			const itemNd = this.inDom;
			const arasObj = aras;
			const itemTypeName = itemNd.getAttribute('type');
			const itemTypeNd = arasObj.getItemTypeNodeForClient(itemTypeName);
			if (!itemTypeNd) {
				arasObj.AlertError(
					arasObj.getResource(
						'',
						'ui_methods_ex.item_type_not_found',
						itemTypeName
					)
				);
				return null;
			}

			const isEditMode =
				arasObj.isTempEx(itemNd) ||
				(arasObj.isLockedByUser(itemNd) && arasObj.isEditStateEx(itemNd));
			const itemID = itemNd.getAttribute('id');
			const isNew =
				itemNd.getAttribute('action') == 'add' &&
				itemNd.getAttribute('isTemp') == '1'
					? true
					: false;
			const keyedName = arasObj.getKeyedNameEx(itemNd);
			const itemTypeLabel =
				arasObj.getItemProperty(itemTypeNd, 'label') || itemTypeName;

			let viewType = 'tab';
			if (itemTypeName == 'Report') {
				viewType = 'reporttool';
			} else if (itemTypeName == 'Method') {
				viewType = 'methodeditor';
			}

			const tmpKey = isEditMode
				? 'ui_methods_ex.itemtype_label_item_keyed_name'
				: 'ui_methods_ex.itemtype_label_item_keyed_name_readonly';
			const title = arasObj.getResource('', tmpKey, itemTypeLabel, keyedName);
			const databaseName = arasObj.getDatabase();

			return {
				isSSVCEnabled: this.isSSVCEnabled,
				item: itemNd,
				itemID: itemID,
				itemTypeName: itemTypeName,
				itemType: itemTypeNd,
				itemTypeLabel: itemTypeLabel,
				title: title,
				viewType: viewType,
				databaseName: databaseName,
				isNew: isNew,
				viewMode: 'tab view',
				isEditMode: isEditMode,
				reserveSpaceForSidebar: this.isSSVCEnabled
			};
		};

		DefaultItemWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.ItemWindow/cuiTabItemView';
		};

		DefaultItemWindowView.prototype.getWindowUrl = function (formHeight) {
			const arasObj = aras;
			const itemTypeName = this.inDom.getAttribute('type');
			const itemTypeNd = arasObj.getItemTypeNodeForClient(itemTypeName);
			if (!itemTypeNd) {
				arasObj.AlertError(
					arasObj.getResource(
						'',
						'ui_methods_ex.item_type_not_found',
						itemTypeName
					)
				);
				return null;
			}

			const state = getTabsState(arasObj, itemTypeNd);
			let result =
				arasObj.getBaseURL() + this.getViewUrl() + '?state=' + encodeURI(state);
			if (formHeight !== undefined) {
				result += '&formHeight=' + formHeight;
			}
			return result;
		};

		return DefaultItemWindowView;
	}
);
