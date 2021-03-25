function ClientControlsFactoryHelper() {}

ClientControlsFactoryHelper.prototype.getFactory = function ClientControlsFactoryHelperGetFactory(
	aWindow
) {
	return new aWindow.ClientControlsFactory();
};
