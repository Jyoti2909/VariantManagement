define([
	'DomainAccessControl/scripts/domainaccesscontrol/DerivedRelationshipListTemplate'
], function (DerivedRelationshipListTemplate) {
	'use strict';
	function DerivedRelationshipList() {
		const self = ArasModules.utils.extendHTMLElement.call(this);
		this.init.call(self);
		return self;
	}

	DerivedRelationshipList.prototype = {
		constructor: Nav.prototype.constructor,
		init: function () {
			this.dom = this;
			this._renderingPromise = null;
			this._lastAnimation = null;
			this.dataStore = {
				roots: null, // <Set>
				items: null // <Map>
			};
			this.selectedItemKey = null;
			this.expandedItemsKeys = new Set();
			const template = DerivedRelationshipListTemplate.initTemplate(this);
			this.templates = template(this);
			const self = this;
		}
	};

	return DerivedRelationshipList;
});
