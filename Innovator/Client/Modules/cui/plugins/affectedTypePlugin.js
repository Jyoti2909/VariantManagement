const affectedTypePlugin = {
	setupAfterInit() {
		this.grid.head.set('affected_type_R', 'image', 'dataType');
	}
};

export default affectedTypePlugin;
