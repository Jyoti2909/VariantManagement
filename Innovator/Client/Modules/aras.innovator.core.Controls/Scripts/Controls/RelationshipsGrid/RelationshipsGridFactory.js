function inherit(Child, Parent) {
	Child.superclass = Parent.prototype;
	Child.prototype = Object.assign({}, Parent.prototype, Child.prototype);
}

var RelationshipsGridFactory = {
	Create: function RelationshipsGridFactoryCreate(itemTypeName) {
		switch (itemTypeName) {
			case 'xClass':
				inherit(XClassRelationshipsGrid, BaseRelationshipsGrid);
				return new XClassRelationshipsGrid();
			case 'ItemTypeXPropertyRelationshipsGrid':
				inherit(ItemTypeXPropertyRelationshipsGrid, BaseRelationshipsGrid);
				return new ItemTypeXPropertyRelationshipsGrid();
			case 'BaseRelationshipsGridWrapper':
				inherit(BaseRelationshipsGridWrapper, BaseRelationshipsGrid);
				return new BaseRelationshipsGridWrapper();
			default:
				return new BaseRelationshipsGrid();
		}
	}
};
