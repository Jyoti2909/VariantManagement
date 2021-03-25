define('Controls/VariantsTree/VariantsTree', [
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Controls/VariantsTree/MultiLayeredView',
	'Controls/VariantsTree/Layers/TreeVisualizationLayer',
	'Controls/VariantsTree/Layers/GroupsVisualizationLayer'
], function (declare, connect, MultiLayeredView, TreeLayer, GroupsLayer) {
	return declare('Controls.VariantsTree', null, {
		layeredView: null,
		_isTreeCreated: false,
		_groupsLayerVisible: false,
		_layerVisualizationParameters: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this._layerVisualizationParameters =
				initialParameters.layerVisualizationParameters || {};
			this.onGroupsSwitched = initialParameters.onGroupsSwitched;

			this.layeredView = new MultiLayeredView({
				connectId: initialParameters.connectId || 'variantsTreeContainer',
				scaleExtent: [0.1, 2]
			});

			connect.connect(
				this.layeredView,
				'onMenuInit',
				function () {
					return this.onTreeMenuInit();
				}.bind(this)
			);
			connect.connect(
				this.layeredView,
				'onMenuSetup',
				function (menuControl, targetLayer, targetDataNode) {
					this.onTreeMenuSetup(menuControl, targetLayer, targetDataNode);
				}.bind(this)
			);
			connect.connect(
				this.layeredView,
				'onMenuItemClick',
				function (commandId, targetDataNode) {
					this.onMenuItemClick(commandId, targetDataNode);
				}.bind(this)
			);
			connect.connect(
				this.layeredView,
				'onScaleChanged',
				function (newScale) {
					this.onScaleChanged(newScale);
				}.bind(this)
			);
		},

		loadTree: function (treeData) {
			/// <summary>
			/// Creates TreeLayer and GroupLayer and loads them into view control.
			/// </summary>
			/// <param name="treeData" type="[Object]">Hierarchical object data structure with single root, where next level children are placed into property
			///  'children'(Array).
			/// </param>
			var d3Framework = this.layeredView.getFramework('d3');
			var treeLayer = new TreeLayer({
				id: 'variantsTree',
				data: treeData,
				visualization: this._layerVisualizationParameters.variantsTree,
				d3Framework: d3Framework
			});
			var groupLayer = new GroupsLayer({
				id: 'groups',
				groupPropertyName: 'sourceName',
				sourceLayer: treeLayer,
				dndCallback: this.onGroupsSwitched,
				visualization: this._layerVisualizationParameters.groups,
				d3Framework: d3Framework
			});

			this.layeredView.addLayer(groupLayer);
			this.layeredView.addLayer(treeLayer);
			this.centerView();

			this._groupsLayerVisible = true;
			this._isTreeCreated = true;
		},

		isTreeLoaded: function () {
			/// <summary>
			/// Identifies that layers already created and loaded into view control.
			/// </summary>
			return this._isTreeCreated;
		},

		getParentNode: function () {
			/// <summary>
			/// Returns layeredView control svg dom Node.
			/// </summary>
			/// <returns>Node</returns>
			return this.layeredView.domNode.parentNode;
		},

		onTreeMenuInit: function () {
			/// <summary>
			/// Returns array of descriptors for all available context menu action.
			/// </summary>
			/// <returns>Array</returns>
			if (this._isTreeCreated) {
				return [
					{ id: 'centerview', name: 'Center View' },
					{ id: 'hidegroups', name: 'Hide Group Names' },
					{ id: 'showgroups', name: 'Show Group Names' },
					{ id: 'collapse_separator', separator: true },
					{ id: 'collapseall', name: 'Collapse All' },
					{ id: 'expandall', name: 'Expand All' }
				];
			}
		},

		onTreeMenuSetup: function (menuControl, targetLayer, targetDataNode) {
			/// <summary>
			/// Handler for setup context menu items state based on target layer and node.
			/// </summary>
			/// <param name="menuControl" type="[Object, MenuWidget]">Menu control, which should be updated.</param>
			/// <param name="targetLayer" type="[Object, VisualizationLayer]">Layer, that contains Node for which menu should be displayed.</param>
			/// <param name="targetDataNode" type="[Object]">Data object that bounded to the target DOM Node.</param>
			var visibleMenuItemsHash = {
				centerview: true,
				collapse_separator: true,
				collapseall: true,
				expandall: true
			};
			var menuItemId;

			visibleMenuItemsHash[
				this._groupsLayerVisible ? 'hidegroups' : 'showgroups'
			] = true;

			for (menuItemId in menuControl.collectionMenu) {
				menuControl.setHide(menuItemId, !visibleMenuItemsHash[menuItemId]);
			}
		},

		onMenuItemClick: function (commandId, targetDataNode) {
			/// <summary>
			/// Menu item click handler.
			/// </summary>
			/// <param name="commandId" type="String">Menu item identifier.</param>
			/// <param name="targetDataNode" type="[Object]">Data object that bounded to the target DOM Node.</param>
			var targetLayer;

			switch (commandId) {
				case 'centerview':
					this.layeredView.centerView();
					break;
				case 'hidegroups':
					this.setGroupsLayerVisibility(false);
					break;
				case 'showgroups':
					this.setGroupsLayerVisibility(true);
					break;
				case 'collapseall':
					targetLayer = this.layeredView.getLayer('variantsTree');
					targetLayer.collapseAll();
					break;
				case 'expandall':
					targetLayer = this.layeredView.getLayer('variantsTree');
					targetLayer.expandAll();
					break;
			}
		},

		setGroupsLayerVisibility: function (isVisible) {
			/// <summary>
			/// Allows to show/hide group layer.
			/// </summary>
			/// <param name="isVisible" type="Boolean">Required layer visibility state.</param>
			var layer = this.layeredView.getLayer('groups');
			if (layer) {
				layer.domNode.style.opacity = isVisible ? '1' : '0';
				this._groupsLayerVisible = isVisible;
			}
		},

		onScaleChanged: function (newScale) {
			/// <summary>
			/// Handler for scale change event.
			/// </summary>
			/// <param name="newScale" type="Number"></param>
		},

		onGroupsSwitched: function (sourceGroupId, targetGroupId, insertAfter) {
			/// <summary>
			/// Handler for event, which appears if user switches group layer items.
			/// </summary>
			/// <param name="sourceGroupId" type="String">Id for group layer item, that was moved.</param>
			/// <param name="targetGroupId" type="String">Id for group layer item on which new position will be calculated.</param>
			/// <param name="insertAfter" type="Boolean">Should be source item placed before or after target item.</param>
		},

		setTreeLayerData: function (layerId, newData) {
			/// <summary>
			/// Sets new data for layer.
			/// </summary>
			/// <param name="layerId" type="String|Number">Layer id or index, which should be updated.</param>
			/// <param name="newData" type="Any">New layer data.</param>
			var treeLayer = this.layeredView.getLayer(layerId);

			if (treeLayer) {
				treeLayer.setData(newData);
			}
		},

		getLeafDataNodesCount: function () {
			/// <summary>
			/// Get count of leaf data items of TreeLayer.
			/// </summary>
			/// <returns>Number</returns>
			var treeLayer = this.layeredView.getLayer('variantsTree');
			var leafNodes = treeLayer.getLeafDataNodes();

			return leafNodes.length;
		},

		setScale: function (newScale) {
			/// <summary>
			/// Sets new scale value for layered view control.
			/// </summary>
			/// <param name="newScale" type="Number"></param>
			this.layeredView.setScale(newScale);
		},

		getScale: function () {
			/// <summary>
			/// Gets current scale value that is used in layered view control.
			/// </summary>
			/// <returns>Number</returns>
			return this.layeredView.getScale();
		},

		setSpacing: function (layerId, spacingValue) {
			/// <summary>
			/// Sets new spacing value between TreeLayer items, which are on adjacent hierarchy levels (horizontal distance).
			/// </summary>
			/// <param name="spacingValue" type="Number">Spacing distance in pixels.</param>
			var treeLayer = this.layeredView.getLayer(layerId);

			if (treeLayer && treeLayer.setSpacing) {
				treeLayer.setSpacing(spacingValue);
				this.layeredView.adjustViewBounds();
			}
		},

		centerView: function () {
			/// <summary>
			/// Calculates and sets optimal view scale, when content fits client viewport.
			/// </summary>
			this.layeredView.centerView();
		},

		adjustViewBounds: function () {
			/// <summary>
			/// Recalculates svg node size based on current view content bounds and scale. Complex operation, which should be used after scale or significant
			/// content changes.
			/// </summary>
			this.layeredView.adjustViewBounds();
		}
	});
});
