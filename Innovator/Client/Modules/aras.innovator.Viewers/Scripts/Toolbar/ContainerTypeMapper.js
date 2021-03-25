define(['dojo/_base/declare'], function (declare) {
	var isInitialized = false;
	var ContainerTypeMapper = declare('ContainerTypeMapper', [], {
		ToolbarContainerTypes: {
			TBasicContainer: 'TBasicContainer',
			TCommandContainer: 'TCommandContainer'
		},

		currentType: null, //ToolbarContainerTypes

		mapBasicToCommand: function () {
			switch (this.currentType) {
				case this.ToolbarContainerTypes.TBasicContainer:
					return this.ToolbarContainerTypes.TCommandContainer;
				case this.ToolbarContainerTypes.TCommandContainer:
					return this.ToolbarContainerTypes.TBasicContainer;
				default:
					return this.ToolbarContainerTypes.TBasicContainer;
			}
		}
	});

	if (!isInitialized) {
		dojo.setObject('VC.Toolbar.ContainerTypeMapper', new ContainerTypeMapper());
		isInitialized = true;
	}
});
