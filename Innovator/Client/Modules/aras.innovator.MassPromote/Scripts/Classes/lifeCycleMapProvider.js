define('MassPromote/Scripts/Classes/lifeCycleMapProvider', [
	'MassPromote/Scripts/Classes/LifeCycleMapModel'
], function (LifeCycleMapModel) {
	return {
		lifeCycleByType: {},

		getLifeCycleMapsByTypeIds: function (itemTypeIds) {
			var notLoaded = this.getNotLoadedMaps(itemTypeIds);
			if (notLoaded.length > 0) {
				this.loadLifeCycleMaps(notLoaded);
			}
			return this.getFromCache(itemTypeIds);
		},

		getFromCache: function (itemTypeIds) {
			var res = [];
			for (var i = 0; i < itemTypeIds.length; i++) {
				var cached = this.lifeCycleByType[itemTypeIds[i]];
				if (cached) {
					res = res.concat(cached);
				}
			}
			return res;
		},

		loadLifeCycleMaps: function (itemTypeIds) {
			var query = buildAMLQuery(itemTypeIds);
			var resultAml = aras.applyAML(query);
			var lifeCycleMapModels = mapToModels(resultAml);
			for (var i = 0; i < lifeCycleMapModels.length; i++) {
				var itemTypeId = lifeCycleMapModels[i].itemTypeId;
				if (!this.lifeCycleByType[itemTypeId]) {
					this.lifeCycleByType[itemTypeId] = [lifeCycleMapModels[i]];
				} else {
					this.lifeCycleByType[itemTypeId].push(lifeCycleMapModels[i]);
				}
			}
		},

		getNotLoadedMaps: function (itemTypeIds) {
			var notLoaded = [];
			for (var i = 0; i < itemTypeIds.length; i++) {
				if (!this.lifeCycleByType[itemTypeIds[i]]) {
					notLoaded.push(itemTypeIds[i]);
				}
			}
			return notLoaded;
		},

		getLifeCycleForItem: function (item) {
			var typeId = item.getAttribute('typeId');
			var stateId = item.getProperty('current_state');
			if (!stateId) {
				return;
			}

			function findState(state) {
				return state.id === stateId;
			}

			var lifeCyclesByType = this.lifeCycleByType[typeId];
			if (lifeCyclesByType) {
				for (var i = 0; i < lifeCyclesByType.length; i++) {
					var lifeCycle = lifeCyclesByType[i];
					var targetStates = lifeCycle.getAllTargetStates();
					var foundStates = targetStates.filter(findState);
					if (foundStates.length > 0) {
						return lifeCycle;
					}
				}
			}
		},

		fetchAvailableStates: function (items, promoteType) {
			var promoteItem = aras.newIOMItem(promoteType, 'mpo_GetAvailableStates');
			items.forEach(function (el) {
				var getStatesItem = aras.newIOMItem(el.getType());
				getStatesItem.setID(el.getID());
				promoteItem.addRelationship(getStatesItem);
			});

			var response = promoteItem.apply();
			var isError = response.isError();
			items.forEach(function (item) {
				if (!isError) {
					var itemNode = response.dom.selectSingleNode(
						'//Item/Relationships/Item[@id="' + item.getID() + '"]'
					);
					if (itemNode) {
						var stateNodes = itemNode.selectNodes('Relationships/Item');
						var ids = [];
						for (var i = 0; i < stateNodes.length; i++) {
							ids.push(stateNodes[i].getAttribute('id'));
						}
						var idlist = ids.join(',');
						item.setProperty('mpo_available_states', idlist);
						return;
					}
				}
				item.setProperty('mpo_available_states', '');
			});
		}
	};

	function mapToModels(resultAml) {
		var lifeCycleMapModels = [];

		var resultItem = aras.newIOMItem();
		resultItem.loadAML(resultAml);

		for (var i = 0; i < resultItem.getItemCount(); i++) {
			var itemTypeNode = resultItem.getItemByIndex(i);
			var itemTypeId = itemTypeNode.getAttribute('id');

			var lifeCycleMapNodes = itemTypeNode.node.selectNodes(
				'Relationships/Item/related_id/Item'
			);
			for (var j = 0; j < lifeCycleMapNodes.length; j++) {
				var model = new LifeCycleMapModel(lifeCycleMapNodes[j], itemTypeId);
				lifeCycleMapModels.push(model);
			}
		}
		return lifeCycleMapModels;
	}

	function buildAMLQuery(itemTypeIds) {
		var itemTypeIdsString = "'" + itemTypeIds.join("','") + "'";
		var amlQuery =
			'<AML>' +
			'  <Item type="ItemType" action="get" select="id, name">' +
			'    <id condition="in">' +
			itemTypeIdsString +
			'</id>' +
			'    <Relationships>' +
			'      <Item type="ItemType Life Cycle" action="get" select="related_id">' +
			'        <related_id>' +
			'          <Item type="Life Cycle Map" action="get" select="id, name">' +
			'            <Relationships>' +
			'              <Item type="Life Cycle Transition" action="get" select="from_state(label), to_state(label), get_comment" />' +
			'            </Relationships>' +
			'          </Item>' +
			'        </related_id>' +
			'      </Item>' +
			'    </Relationships>' +
			'  </Item>' +
			'</AML>';
		return amlQuery;
	}
});
