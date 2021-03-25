const ColumnSelectionMediatorFactory = {
	CreateBaseMediator: function ColumnSelectionMediatorFactoryCreateBaseMediator(
		xClassBarNode
	) {
		return new BaseColumnSelectionMediator(xClassBarNode);
	},
	CreateRelationshipMediator: function ColumnSelectionMediatorFactoryCreateRelationshipMediator(
		xClassBarNode
	) {
		return new RelationshipColumnSelectionMediator(xClassBarNode);
	}
};
