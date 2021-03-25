define(['dojo/_base/declare'], function (declare) {
	// According to the specification we have 4 reason why item is invalid:
	// 1 Item is locked
	// 2 Wrong Life Cycle Map
	// 3 No path to target state
	// 4 No permission to promote to target state
	// 5 Item is new
	// 6 Item is deleted

	// According to the specification we have 4 rules, which responsible for
	// what message to show depending on reasons.
	var rules = [
		// If multiple from (2,3,4) and NOT 1,5,6
		// Show only one message, in priority order of 2, 3, 4
		{
			fulfilCondition: function (itemInfo) {
				return (
					!itemInfo.locked &&
					!itemInfo.isNew &&
					!itemInfo.deleted &&
					(!itemInfo.correctLifecycle ||
						!itemInfo.pathExist ||
						!itemInfo.hasPermission)
				);
			},
			getMessage: function (item, itemInfo) {
				if (!itemInfo.correctLifecycle) {
					return getInvalidLifeCycleError(item);
				}

				if (!itemInfo.pathExist) {
					return errorMessages.noPath;
				}

				if (!itemInfo.hasPermission) {
					return errorMessages.noPermissions;
				}
			}
		},

		// If 1 and 3 (reason)
		// Show the two combined as follows: Item Locked, No Promotion Path to Target State
		{
			fulfilCondition: function (itemInfo) {
				return (
					itemInfo.locked && !itemInfo.pathExist && itemInfo.correctLifecycle
				);
			},
			getMessage: function () {
				return errorMessages.lockedAndNoState;
			}
		},

		// If 1 and (2 OR 4 OR (2 AND 4))
		// Show message only for 2 or 4, using the same logic from Case A.  Do not show message 1
		{
			fulfilCondition: function (itemInfo) {
				return (
					itemInfo.locked &&
					(!itemInfo.correctLifecycle || !itemInfo.hasPermission)
				);
			},
			getMessage: function (item, itemInfo) {
				if (!itemInfo.correctLifecycle) {
					return getInvalidLifeCycleError(item);
				}

				if (!itemInfo.hasPermission) {
					return errorMessages.noPermissions;
				}
			}
		},

		// if only reason 1, show locked message
		{
			fulfilCondition: function (itemInfo) {
				return (
					itemInfo.locked &&
					itemInfo.correctLifecycle &&
					itemInfo.pathExist &&
					itemInfo.hasPermission
				);
			},
			getMessage: function (item) {
				return errorMessages.locked;
			}
		},

		// if item is new
		{
			fulfilCondition: function (itemInfo) {
				return itemInfo.isNew;
			},
			getMessage: function () {
				return errorMessages.newItem;
			}
		},

		// if item is deleted
		{
			fulfilCondition: function (itemInfo) {
				return itemInfo.deleted;
			},
			getMessage: function () {
				return errorMessages.deleted;
			}
		}
	];

	var errorMessages = {
		noLifeCycleMap: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'no_life_cycle_map'
		),
		noPath: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'no_promotion_path_to_target_state'
		),
		noPermissions: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'not_permitted_to_promote_to_target_state'
		),
		lockedAndNoState: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'item_locked_no_promotion_path_to_target_state'
		),
		locked: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'item_locked'
		),
		newItem: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'new_item'
		),
		deleted: aras.getResource(
			'../Modules/aras.innovator.MassPromote/',
			'item_deleted'
		)
	};

	var getInvalidLifeCycleError = function (item) {
		var lifeCycleMap = item.getProperty('mpo_life_cycle_map');
		return lifeCycleMap || errorMessages.noLifeCycleMap;
	};

	return declare(null, {
		validateItems: function (items, lifecycleMap, targetState) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				item.setProperty('mpo_isItemValid', '1');
				item.setProperty('mpo_status', '');
				const locked = item.getProperty('locked_by_id');
				const itemInfo = {
					locked: locked,
					correctLifecycle: this._isLifecycleValidForItem(item, lifecycleMap),
					pathExist: this._isPathExist(item, lifecycleMap, targetState),
					hasPermission: this._hasPromotePermission(item, targetState, locked),
					isNew: aras.isNew(item.node),
					deleted: item.getProperty('mpo_notFound')
				};
				for (var j = 0; j < rules.length; j++) {
					if (rules[j].fulfilCondition(itemInfo)) {
						var errorMessage = rules[j].getMessage(item, itemInfo);
						item.setProperty('mpo_isItemValid', '0');
						item.setProperty('mpo_status', errorMessage);
						break;
					}
				}
				this._checkOnIsCurrent(item);
			}
		},

		_checkOnIsCurrent: function (item) {
			if (
				item.getProperty('mpo_isItemValid') === '1' &&
				item.getProperty('is_current') === '0'
			) {
				item.setProperty(
					'mpo_status',
					aras.getResource(
						'../Modules/aras.innovator.MassPromote/',
						'item_not_current'
					)
				);
			}
		},

		_isLifecycleValidForItem: function (item, lifecycleMap) {
			if (!lifecycleMap) {
				return true;
			}

			var itemLifeCycleMapId = item.getPropertyAttribute(
				'mpo_life_cycle_map',
				'id'
			);
			if (itemLifeCycleMapId) {
				return lifecycleMap.id === itemLifeCycleMapId;
			}
			return false;
		},

		_hasPromotePermission: function (item, targetState, locked) {
			if (targetState && !locked) {
				var availableStates = item.getProperty('mpo_available_states');
				if (availableStates && availableStates.indexOf(targetState.id) > -1) {
					return true;
				}
				return false;
			}
			return true;
		},

		_isPathExist: function (item, lifecycleMap, targetState) {
			if (lifecycleMap && targetState) {
				return lifecycleMap.transitions.some(function (el) {
					var fromState = el.fromState.id === item.getProperty('current_state');
					var toState = el.toState.id === targetState.id;
					return fromState && toState;
				});
			}
			return true;
		}
	});
});
