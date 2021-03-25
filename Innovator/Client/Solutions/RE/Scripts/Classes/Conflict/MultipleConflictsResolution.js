define([
	'dojo/_base/declare',
	'dojo/aspect',
	'dijit/Tooltip',
	'RE/Scripts/Classes/Conflict/ConflictResolutionBase'
],

function(declare, aspect, Tooltip, ConflictResolutionBase) {
	return declare('Aras.Client.Controls.RE.MultipleConflictsResolution', [ConflictResolutionBase], {
		_conflictIds: null,
		_parentsByItemId: null,
		_iconPrefix: null,
		_menu: null,
		_tooltip: null,
		viewmodel: null,
		control: null,
		_requirementsHelper: null,

		constructor: function(args) {
			this._conflictIds = [];
			this._parentsByItemId = {};
			this._tooltip = {};
			this._iconPrefix = 'icon_';

			this.aras = args.aras;
			this.control = args.control;
			this.viewmodel = args.viewmodel;
			this._requirementsHelper = this.viewmodel.getRequirementsHelper();
			aspect.after(this.viewmodel, 'Reload', this.setNewItem.bind(this), true);
			aspect.after(this.viewmodel, 'Reload', this.dropConflicts.bind(this), true);
		},

		_onRequirementConflict: function(evnt) {
			this.inherited(arguments, [evnt, false]);

			let message = this.getMessage('conflict_dialog_details');
			this.confirm(message, {
				title: this.getMessage('conflict_dialog_title'),
				isStandalone: false,
			});

			this._setupConflictButtons();
		},

		_setupConflictButtons: function() {
			let conflictIds = [];
			let configIdNodes = this._item.selectNodes('conflicts/Item/latest_item/Item/config_id');
			for (let configIdIndex = 0; configIdIndex < configIdNodes.length; configIdIndex++) {
				let configId = configIdNodes[configIdIndex].text;
				conflictIds.push(configId);

				this._setTooltip(configId);
				this.viewmodel.setRequirementConflictState('Unresolved', configId);
			}

			// _markConflictItem should be called only after conflictIds array is populated.
			// It is need for detecting parent conflicts.
			this._conflictIds = conflictIds;
			for (let idIndex = 0; idIndex < conflictIds.length; idIndex++) {
				this._markConflictItem(conflictIds[idIndex]);
			}
			this._setupClick();
		},

		_setupClick: function() {
			if (!this._isClickSubscribed) {
				this._isClickSubscribed = aspect.around(this.control, '_onSelectRow', function(originalOnSelectRow) {
					return function(event) {
						const targetNode = event.target;
						return event.button == 0 && targetNode && targetNode.tagName == 'IMG' && this._onConflictButtonClick(targetNode) ||
							originalOnSelectRow.apply(this.control, [event]);
					}.bind(this);
				}.bind(this));
			}
		},

		_setTooltip: function(buttonId) {
			buttonId = this._iconPrefix + buttonId;
			if (!this._tooltip[buttonId]) {
				let buttonDom = this._getButtonDom(buttonId);
				this._tooltip[buttonId] = new Tooltip({
					connectId: buttonDom,
					position: ['after'],
					getContent: this._getTooltipContent.bind(this)
				});
			}
		},

		_getTooltipContent: function(node) {
			let id = node.getAttribute('reqId').replace(this._iconPrefix, '');
			let modifiedOn = this._item.selectSingleNode('conflicts/Item/latest_item/Item[./config_id="' + id + '"]/modified_on').text;
			let modifiedBy = this._item.selectSingleNode('conflicts/Item/latest_item/Item[./config_id="' + id + '"]/modified_by_id').getAttribute('keyed_name');

			return this.getMessage('conflict_tooltip', [modifiedOn, modifiedBy]);
		},

		_onConflictButtonClick: function(button) {
			let clickOnButtonId = button.getAttribute('reqId');
			if (clickOnButtonId && this._conflictIds.indexOf(clickOnButtonId.replace(this._iconPrefix, '')) != -1) {
				this._showMenu(clickOnButtonId);
				return true;
			}
		},

		_showMenu: function(buttonId) {
			let buttonDom = this._getButtonDom(buttonId);
			let menu = this._getMenu();
			let menuData = this._getMenuData(buttonId.replace(this._iconPrefix, ''));
			menu.applyData(menuData);
			menu.show({
				x: 25,
				y: buttonDom.parentNode.offsetTop
			}, buttonId);
		},

		_getButtonDom: function(buttonId) {
			return document.querySelector('img[reqId="' + buttonId + '"]');
		},

		_getMenu: function() {
			if (!this._menu) {
				this._menu = new ArasModules.ContextMenu();
				this._menu.on('click', this._menuClick.bind(this));
			}

			return this._menu;
		},

		_getMenuData: function(buttonId) {
			return {
				'use_my_unsaved': {
					label: this.getMessage('conflict_save_anyway'),
					disabled: !this._isUseMyChangesAllowed(buttonId)
				},
				'use_others': {
					label: this.getMessage('conflict_discard'),
				},
				'before_mass_resolve_separator': {},
				'mass_resolve': {
					label: this.getMessage('conflict_contextmenu_mass_resolve'),
					disabled: !this._isCurrentItemHasChildWithConflict(buttonId),
					children: {
						'mass_use_my_unsaved': {
							label: this.getMessage('conflict_save_anyway'),
							disabled: !this._isMassUseMyChangesAllowed(buttonId)
						},
						'mass_use_others': {
							label: this.getMessage('conflict_discard'),
						}
					}
				}
			};
		},

		_isMassUseMyChangesAllowed: function(itemId) {
			const allInnerConflictsIds = this._getAllChildIdsWithConflicts(itemId);
			for (let i = 0; i < allInnerConflictsIds.length; i++) {
				if (!this._isUseMyChangesAllowed(allInnerConflictsIds[i])) {
					return false;
				}
			}

			return true;
		},

		_isUseMyChangesAllowed: function(itemId) {
			const conflictItem = this._getConflictItemByConfigId(itemId);
			if (conflictItem) {
				return !this.aras.isLocked(conflictItem) || this.aras.isLockedByUser(conflictItem);
			}
		},

		_isCurrentItemHasChildWithConflict: function(buttonId) {
			for (let id in this._parentsByItemId) {
				if (this._parentsByItemId[id].indexOf(buttonId) != -1) {
					return true;
				}
			}
		},

		_menuClick: function(menyId, e, buttonId) {
			let id = buttonId.replace(this._iconPrefix, '');
			switch (menyId) {
				case 'use_my_unsaved':
					this._applyMyChanges([id]);
					break;
				case 'use_others':
					this._applyOthersChanges([id]);
					break;
				case 'mass_use_my_unsaved':
					let idsToResolveMy = this._getAllChildIdsWithConflicts(id);
					this._applyMyChanges(idsToResolveMy);
					break;
				case 'mass_use_others':
					let idsToResolveOthers = this._getAllChildIdsWithConflicts(id);
					this._applyOthersChanges(idsToResolveOthers);
					break;
				default:
					break;
			}
		},

		_applyMyChanges: function(itemIds) {
			for (let idIndex = 0; idIndex < itemIds.length; idIndex++) {
				let itemId = itemIds[idIndex];
				let requirement = this.viewmodel.getRequirementWithContent(itemId);
				this._requirementsHelper.setRequirementPropertyValue(requirement, 'global_version', this._getResolvedForValue(itemId));

				this.viewmodel.lockUnlockItemById('lock', this._requirementsHelper.getRequirementId(requirement));
				const res = this.aras.saveItemEx(requirement.node);
				this.viewmodel.lockUnlockItemById('unlock', this.aras.getItemProperty(res, 'id'));

				this._refreshStates(itemId);
			}
		},

		_applyOthersChanges: function(itemIds) {
			let massResolveIds = [];
			for (let idIndex = 0; idIndex < itemIds.length; idIndex++) {
				let itemId = itemIds[idIndex];
				const isCurrentReq = this._requirementsHelper.getExistingRequirementsFromServer({
					properties: {
						'config_id': itemId
					},
					attributes: {
						'language': this.viewmodel.CurrentLanguageCode()
					}
				});

				if (!isCurrentReq.isError()) {
					let oldItem = this.viewmodel._getRequirementById(itemId);
					this.aras.updateInCacheEx(oldItem.node, isCurrentReq.node);

					let topWindow = this.aras.getMostTopWindowWithAras();
					topWindow.updateItemsGrid(isCurrentReq.node);
					massResolveIds.push(itemId);

					this._refreshStates(itemId);
					this.viewmodel.silentReplaceOrigin(isCurrentReq);
				}
			}

			this.viewmodel._generateRequirementDocumentWithRelationships();
			this.control.updateTitlesForReqsList(massResolveIds);
			this.viewmodel.runMassInvalidationManually(massResolveIds);
		},

		_getResolvedForValue: function(id) {
			return this._item.selectSingleNode('conflicts/Item/latest_item/Item[./config_id="' + id + '"]/global_version').text;
		},

		_getAllChildIdsWithConflicts: function(itemId) {
			let ids = [itemId];
			for (let id in this._parentsByItemId) {
				if (this._parentsByItemId[id].indexOf(itemId) != -1) {
					ids.push(id);
				}
			}

			return ids;
		},

		_markConflictItem: function(reqId) {
			let allParents = this.control.getAllParentsIdsByReqId(reqId);

			let parentReqIds = [];
			for (let parentIndex = 0; parentIndex < allParents.length; parentIndex++) {
				let parentReqId = this.control.getRequirementIdByRowId(allParents[parentIndex]);
				if (parentReqId) {
					parentReqIds.push(parentReqId);

					const iconState = this._conflictIds.indexOf(parentReqId) == -1 ? 'LowerConflicts' : 'UnresolvedPlusLower';
					this.viewmodel.setRequirementConflictState(iconState, parentReqId);
				}
			}

			this._parentsByItemId[reqId] = parentReqIds;
		},

		_refreshStates: function(resolvedReqId) {
			let idsToRefresh = this._parentsByItemId[resolvedReqId];
			this._cleanUpForResolved(resolvedReqId);

			idsToRefresh.push(resolvedReqId);

			for (let idIndex = 0; idIndex < idsToRefresh.length; idIndex++) {
				let itemId = idsToRefresh[idIndex];
				let isInConflict = this._conflictIds.indexOf(itemId) !== -1;

				// _getAllChildIdsWithConflicts - returns array, where first item is parameter that passed to method.
				// Children are started from position 1. Lower conflicts are exist if array contains more then 1 item
				let hasLowerConflicts = this._getAllChildIdsWithConflicts(itemId).length > 1;

				let iconState = '';
				if (isInConflict && hasLowerConflicts) {
					iconState = 'UnresolvedPlusLower';
				} else if (isInConflict) {
					iconState = 'Unresolved';
				} else if (hasLowerConflicts) {
					iconState = 'LowerConflicts';
				}

				this.viewmodel.setRequirementConflictState(iconState || 'Blank', itemId);

				this.control.setNewState(itemId, iconState ? 'conflict' : '');
			}
		},

		_cleanUpForResolved: function(resolvedReqId) {
			// remove resolved item from arrays that contains information only about  conflicted items.
			this._conflictIds.splice(this._conflictIds.indexOf(resolvedReqId), 1);
			delete this._parentsByItemId[resolvedReqId];
			let tooltipId = this._iconPrefix + resolvedReqId;
			this._tooltip[tooltipId].destroy();
			delete this._tooltip[tooltipId];
		},

		dropConflicts: function() {
			if (this._conflictIds && this._conflictIds.length) {
				const expiredConflicts = this._conflictIds.slice();
				for (let i = 0; i < expiredConflicts.length; i++) {
					const itemId = expiredConflicts[i];
					this._refreshStates(itemId);
				}

				this.removeConflicts();
			}
		}
	});
});
