VC.Utils.Page.LoadModules(['Toolbar/ContainerTypeMapper']);

dojo.setObject(
	'VC.ToolbarManager',
	(function () {
		return dojo.declare('ToolbarManager', null, {
			toolbarContainersName: 'toolbarContainers',
			currentContainer: null, // ITContainer
			containersArr: {}, // { "iTContainerType1": ITContainer, "iTContainerType2": ITContainer, ... }

			onViewToolbarBind: function () {},

			getContainerTypeFromInnovator: function () {
				var returnedType = null;
				var useStandardToolbar = VC.Utils.getUseStandartToolbar();

				if (useStandardToolbar) {
					returnedType =
						VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
							.TCommandContainer;
				} else {
					returnedType =
						VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
							.TBasicContainer;
				}

				return returnedType;
			},

			showITContainer: function (containerType) {
				if (!containerType) {
					containerType = this.getContainerTypeFromInnovator();
				}

				var container = this.getContainerByType(containerType);

				if (!container) {
					VC.Utils.Page.LoadModules(['Toolbar/' + containerType]);
					container = new VC.Toolbar[containerType](this.toolbarContainersName);
					this.containersArr[containerType] = container;
				}

				this.currentContainer = container;
				VC.Toolbar.ContainerTypeMapper.currentType = containerType;
				this._hideAllContainers();
				this.currentContainer.show();
			},

			getContainerByType: function (/*ToolbarContainerTypes*/ containerType) {
				return this.containersArr[containerType];
			},

			createToolbarPallete: function (palleteName) {
				return currentContainer.createPallete(palleteName);
			},

			_hideAllContainers: function () {
				for (var container in this.containersArr) {
					if (this.containersArr[container].hide) {
						this.containersArr[container].hide();
					}
				}
			}
		});
	})()
);
