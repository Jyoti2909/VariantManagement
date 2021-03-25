define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		aras: null,

		_effectiveItemTypeId: null,

		_effectivityExpressionItemTypeId: null,

		_effectivityExpressionItemTypeName: null,

		_isEffectivityExpressionItemTypeMetadataInitialized: false,

		constructor: function (aras, effectiveItemTypeId) {
			this.aras = aras;
			this._effectiveItemTypeId = effectiveItemTypeId;

			Object.defineProperty(this, 'effectivityExpressionItemTypeId', {
				get: function () {
					this._initEffectivityExpressionItemTypeMetadata();

					return this._effectivityExpressionItemTypeId;
				},
				enumerable: true
			});

			Object.defineProperty(this, 'effectivityExpressionItemTypeName', {
				get: function () {
					this._initEffectivityExpressionItemTypeMetadata();

					return this._effectivityExpressionItemTypeName;
				},
				enumerable: true
			});
		},

		getExpressionItems: function (
			effectiveItemId,
			expressionItemPropertiesToSelect
		) {
			const effectivityExpressionItemTypeName = this
				.effectivityExpressionItemTypeName;

			if (!effectivityExpressionItemTypeName) {
				return this.aras.IomInnovator.newError(
					'No Effectivity Expression ItemType found'
				);
			}

			const effectivityExpressionItems = this.aras.newIOMItem(
				effectivityExpressionItemTypeName,
				'get'
			);
			effectivityExpressionItems.setAttribute(
				'select',
				typeof expressionItemPropertiesToSelect === 'string'
					? expressionItemPropertiesToSelect
					: 'effs_scope_id,string_notation'
			);
			effectivityExpressionItems.setProperty('source_id', effectiveItemId);

			return effectivityExpressionItems.apply();
		},

		_getRelationshipFromScopeToEffectiveItemType: function (
			effectiveItemTypeId
		) {
			const scopeItemTypeRelationship = this.aras.newIOMItem(
				'effs_scope_itemtype',
				'get'
			);
			scopeItemTypeRelationship.setAttribute(
				'select',
				'effs_expression_itemtype_id'
			);
			scopeItemTypeRelationship.setAttribute('maxRecords', '1');
			scopeItemTypeRelationship.setProperty('related_id', effectiveItemTypeId);

			return scopeItemTypeRelationship.apply();
		},

		_initEffectivityExpressionItemTypeMetadata: function () {
			if (this._isEffectivityExpressionItemTypeMetadataInitialized) {
				return;
			}

			const scopeItemTypeRelationship = this._getRelationshipFromScopeToEffectiveItemType(
				this._effectiveItemTypeId
			);

			if (!scopeItemTypeRelationship.isError()) {
				this._effectivityExpressionItemTypeId = scopeItemTypeRelationship.getProperty(
					'effs_expression_itemtype_id'
				);
				this._effectivityExpressionItemTypeName = scopeItemTypeRelationship.getPropertyAttribute(
					'effs_expression_itemtype_id',
					'name'
				);
				this._isEffectivityExpressionItemTypeMetadataInitialized = true;
			}
		}
	});
});
