/* global define */
define([
	'dojo/_base/declare',
	'QB/Scripts/qbDataModel',
	'QB/Scripts/qbDataStore',
	'QB/Scripts/qbTreeEnum'
], function (declare, QbDataModel, QbDataStore, QbTreeEnum) {
	var dataModel = new QbDataModel();
	var qbTreeEnum = new QbTreeEnum();

	var findRootQueryItemId = function (queryDefinition) {
		var references = aras.getRelationships(
			queryDefinition,
			'qry_QueryReference'
		);
		for (var i = 0; i < references.length; i++) {
			var reference = references[i];
			var parentRefId = aras.getItemProperty(reference, 'parent_ref_id');
			var childRefId = aras.getItemProperty(reference, 'child_ref_id');
			if (!parentRefId) {
				return childRefId;
			}
		}
	};

	return declare('qbDataLoader', [], {
		isReferencingByReferenceRefId: null,

		constructor: function () {},

		load: function (qdItemNode) {
			this.loadMetaData(qdItemNode);
			var dataStore = new QbDataStore();

			var rootElementModel = this.generateRootItemTypeElement(
				qdItemNode,
				dataStore
			);
			//if to get qryDefinition using getThisItem() sometimes gives an error on apply. So, it's better to create a qryDefinition based on node
			var qryDefinition = aras.newIOMItem();
			qryDefinition.loadAML('<AML>' + qdItemNode.xml + '</AML>');
			this.setIsReferencingItemFromServer(qryDefinition);
			if (rootElementModel) {
				this.parseItemsRecursive(rootElementModel, qdItemNode, dataStore);
			} else {
				this.generateEmptyRootElement(qdItemNode, dataStore);
			}

			return dataStore;
		},

		setIsReferencingItemFromServer: function (qryDefinitionItem) {
			this.isReferencingByReferenceRefId = {};
			var qdItemSetIsReferencing = qryDefinitionItem.apply(
				'qry_SetIsReferencingItem'
			);
			qdItemSetIsReferencing = qdItemSetIsReferencing
				.getInnovator()
				.getItemInDom(qdItemSetIsReferencing.dom);
			var queryReferenceItems = qdItemSetIsReferencing.getRelationships(
				'qry_QueryReference'
			);
			var queryReferenceItemsCount = queryReferenceItems.getItemCount();
			for (var i = 0; i < queryReferenceItemsCount; i++) {
				var queryReferenceItem = queryReferenceItems.getItemByIndex(i);
				if (queryReferenceItem.getAttribute('is_referencing_item') === '1') {
					this.isReferencingByReferenceRefId[
						queryReferenceItem.getProperty('ref_id')
					] = true;
				}
			}
		},

		loadMetaData: function (qdItem) {
			if (!parent.aras.isDirtyEx(qdItem) && !parent.aras.isNew(qdItem)) {
				var body =
					'<Relationships>' +
					"<Item type='qry_QueryItemSelectProperty' action='get'></Item>" +
					"<Item type='qry_QueryItemSortProperty' action='get'></Item>" +
					'</Relationships>';

				parent.aras.getItemRelationshipsEx(
					qdItem,
					'qry_QueryItem',
					undefined,
					undefined,
					body,
					true
				);
				parent.aras.getItemRelationshipsEx(
					qdItem,
					'qry_QueryReference',
					undefined,
					undefined,
					undefined,
					true
				);
				parent.aras.getItemRelationshipsEx(
					qdItem,
					'qry_QueryParameter',
					undefined,
					undefined,
					undefined,
					true
				);
			}
		},

		generateRootItemTypeElement: function (qdItem, dataStore) {
			var rootItemRefId = findRootQueryItemId(qdItem);
			var rootQueryItem = this.getQueryItemByRefId(qdItem, rootItemRefId);

			if (rootQueryItem) {
				var rootElementModel = {
					id: 'root',
					name: aras.getItemProperty(rootQueryItem, 'alias'),
					itemTypeId: aras.getItemProperty(rootQueryItem, 'item_type'),
					type: qbTreeEnum.TreeModelType.RootItemType,
					node: rootQueryItem,
					refId: rootItemRefId
				};
				var rootTreeElement = new dataModel.TreeElementModel();
				rootTreeElement.element = rootElementModel;
				dataStore.treeModelCollection.push(rootTreeElement);
				return rootTreeElement;
			}
			return null;
		},

		generateEmptyRootElement: function (qdItem, dataStore) {
			var rootElementModel = {
				id: 'root',
				name: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'tree.empty_root'
				),
				type: qbTreeEnum.TreeModelType.EmptyRootItemType
			};
			var rootTreeElement = new dataModel.TreeElementModel();
			rootTreeElement.element = rootElementModel;
			dataStore.treeModelCollection.push(rootTreeElement);
			return rootTreeElement;
		},

		getQueryItemByRefId: function (qdItem, itemRefId) {
			var queryItemXpath =
				"Relationships/Item[@type='qry_QueryItem' and not(@action='delete') and ref_id= '" +
				itemRefId +
				'\' and item_type!=""]';
			var item = qdItem.selectSingleNode(queryItemXpath);
			if (item) {
				return item;
			} else {
				return undefined;
			}
		},

		parseItemsRecursive: function (parentElement, qdItem, dataStore) {
			if (parentElement.getType() === qbTreeEnum.TreeModelType.RecursionItem) {
				return;
			}
			if (!parentElement.properties) {
				parentElement.element.properties = this.getItemAvailableProperties(
					parentElement.node
				);
			}
			this.findChildElements(parentElement.element, qdItem, dataStore);
			var children = dataStore.getChildren(parentElement);
			for (var i = 0; i < children.length; i++) {
				this.parseItemsRecursive(children[i], qdItem, dataStore);
			}
		},

		findChildElements: function (parentElement, qdItem, dataStore) {
			var queryReferenceXpath =
				"Relationships/Item[@type='qry_QueryReference' and not(@action='delete') and " +
				"parent_ref_id= '" +
				parentElement.refId +
				"']";
			var queryReferences = qdItem.selectNodes(queryReferenceXpath);

			for (var i = 0; i < queryReferences.length; i++) {
				var curQueryReference = queryReferences[i];
				var referenceRefId = aras.getItemProperty(curQueryReference, 'ref_id');
				var filterXml = aras.getItemProperty(curQueryReference, 'filter_xml');
				var childRefId = aras.getItemProperty(
					curQueryReference,
					'child_ref_id'
				);
				var childQueryItem = this.getQueryItemByRefId(qdItem, childRefId);

				if (filterXml) {
					var childProperties = this.getItemAvailableProperties(childQueryItem);
					var removedProperties = [];
					var referencePredicate = this.getReferencePredicate(
						filterXml,
						parentElement.properties,
						childProperties,
						removedProperties
					);
					if (referencePredicate) {
						referencePredicate.referenceRefId = referenceRefId;
					} else {
						var message = aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'broken_references.qry_reference',
							aras.getItemProperty(childQueryItem, 'alias'),
							removedProperties.join(', ')
						);
						aras.AlertError(message);
						continue;
					}

					var checkOnRecursion = this.conditionIsRecursion(
						qdItem,
						parentElement,
						childRefId,
						dataStore
					);
					if (checkOnRecursion.isRecursion) {
						// this recursion
						this.createRecursionItem(
							childQueryItem,
							parentElement,
							dataStore,
							childProperties,
							referencePredicate,
							checkOnRecursion.source
						);
						continue;
					}

					if (this.conditionIsRelationship(referencePredicate)) {
						// this relationship
						this.createRelationshipItem(
							childQueryItem,
							parentElement,
							dataStore,
							childProperties,
							referencePredicate
						);
						continue;
					}

					if (this.conditionIsRelated(referencePredicate)) {
						// this related item
						this.createRelatedItem(
							childQueryItem,
							parentElement,
							dataStore,
							childProperties,
							referencePredicate
						);
						continue;
					}

					if (this.conditionIsProperty(referencePredicate)) {
						// this is property
						this.createPropertyItem(
							childQueryItem,
							parentElement,
							dataStore,
							childProperties,
							referencePredicate
						);
						continue;
					}

					// this where used item
					if (this.conditionIsWhereUsed(referencePredicate)) {
						this.createWhereUsedItem(
							childQueryItem,
							parentElement,
							dataStore,
							childProperties,
							referencePredicate
						);
						continue;
					}

					this.createCustomJoinItem(
						childQueryItem,
						parentElement,
						dataStore,
						childProperties,
						referencePredicate
					);
				}
			}
		},

		conditionIsRelationship: function (referencePredicate) {
			if (referencePredicate) {
				if (
					!referencePredicate.isComplexPredicate &&
					referencePredicate.source === 'id' &&
					referencePredicate.related === 'source_id'
				) {
					return true;
				}
			}
			return false;
		},

		conditionIsRelated: function (referencePredicate) {
			if (referencePredicate) {
				if (
					!referencePredicate.isComplexPredicate &&
					referencePredicate.source === 'related_id' &&
					referencePredicate.related === 'id'
				) {
					return true;
				}
			}
			return false;
		},

		conditionIsWhereUsed: function (referencePredicate) {
			if (referencePredicate) {
				if (
					!referencePredicate.isComplexPredicate &&
					referencePredicate.source === 'id' &&
					referencePredicate.related !== 'source_id'
				) {
					return true;
				}
			}
			return false;
		},

		conditionIsProperty: function (referencePredicate) {
			if (referencePredicate) {
				if (
					!referencePredicate.isComplexPredicate &&
					referencePredicate.source !== 'related_id' &&
					referencePredicate.related === 'id'
				) {
					return true;
				}
			}
			return false;
		},

		conditionIsRecursion: function (
			qdItem,
			parentElement,
			childRefId,
			dataStore
		) {
			var res = { source: null, isRecursion: false };

			for (let i = 0; i < dataStore.treeModelCollection.length; i++) {
				const currentRoot = dataStore.treeModelCollection[i];
				if (currentRoot.refId === childRefId) {
					res.source = currentRoot;
					res.isRecursion = true;
					return res;
				}
			}
			return res;
		},

		createItemBase: function (
			model,
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			model.id = queryItem.getAttribute('id');
			model.name = aras.getItemProperty(queryItem, 'alias');
			model.itemTypeId = aras.getItemProperty(queryItem, 'item_type');
			model.node = queryItem;
			model.refId = aras.getItemProperty(queryItem, 'ref_id');
			model.sortOrder = aras.getItemProperty(queryItem, 'sort_order');
			model.parentId = parentElement.id;
			model.properties = properties;
			model.referencePredicate = referencePredicate;

			var treeElement = new dataModel.TreeElementModel();
			treeElement.element = model;
			treeElement.parentId = model.parentId;
			treeElement.isReferencing = this.isReferencingByReferenceRefId[
				referencePredicate.referenceRefId
			];
			treeElement.referenceRefId = referencePredicate.referenceRefId;
			dataStore.treeModelCollection.push(treeElement);
			return treeElement;
		},

		createPropertyItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			var model = new dataModel.PropertyTypeModel();
			return this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
		},

		createRelationshipItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			var model = new dataModel.RelationshipTypeModel();
			return this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
		},

		createRelatedItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			var model = new dataModel.RelatedTypeModel();
			return this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
		},

		createRecursionItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate,
			sourceElement
		) {
			var model = new dataModel.RecursionTypeModel();
			var treeElement = this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
			treeElement.element.id = aras.generateNewGUID();
			treeElement.element.sourceElementId = sourceElement.id;
			return treeElement;
		},

		createWhereUsedItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			var model = new dataModel.WhereUsedTypeModel();
			return this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
		},

		createCustomJoinItem: function (
			queryItem,
			parentElement,
			dataStore,
			properties,
			referencePredicate
		) {
			var model = new dataModel.CustomJoinTypeModel();
			return this.createItemBase(
				model,
				queryItem,
				parentElement,
				dataStore,
				properties,
				referencePredicate
			);
		},

		getReferencePredicate: function (
			conditionXml,
			parentProperties,
			childProperties,
			removedProperties
		) {
			var doc = aras.createXMLDocument();
			doc.loadXML(conditionXml);

			var predicate = doc.selectNodes('/condition/eq/property');
			if (predicate && predicate.length === 2) {
				var firstProperty = predicate[0].getAttribute('name');
				var isFirstFromParent =
					predicate[0].getAttribute('query_items_xpath') === 'parent::Item';
				var secondProperty = predicate[1].getAttribute('name');
				var isSecondFromParent =
					predicate[1].getAttribute('query_items_xpath') === 'parent::Item';
				var findProperty = function (name) {
					return function (property) {
						if (property.name === name) {
							return true;
						}
					};
				};
				var parentProperty = isFirstFromParent ? firstProperty : secondProperty;
				var childProperty = isSecondFromParent ? firstProperty : secondProperty;

				var parentCondition = parentProperties.find(
					findProperty(parentProperty)
				);
				var childCondition = childProperties.find(findProperty(childProperty));

				if (parentCondition && childCondition) {
					return {
						isComplexPredicate: false,
						source: parentCondition.name,
						related: childCondition.name
					};
				}
				if (!parentCondition) {
					removedProperties.push(parentProperty);
				}
				if (!childCondition) {
					removedProperties.push(childProperty);
				}
			}
			return {
				isComplexPredicate: true
			};
		},

		getPropertyByCriteria: function (criteria, value, properties) {
			return properties.filter(function (property) {
				return property[criteria] === value;
			})[0];
		},

		getItemAvailableProperties: function (node) {
			var qryItem = aras.newIOMItem();
			qryItem.loadAML(node.xml);
			qryItem = qryItem.apply('qry_GetAvailableProperties');
			if (qryItem.isError()) {
				aras.AlertError(qryItem);
				return;
			}
			var properties = [];
			for (var i = 0; i < qryItem.getItemCount(); i++) {
				var availableProperty = qryItem.getItemByIndex(i);
				properties.push({
					name: availableProperty.getProperty('name'),
					label: availableProperty.getProperty('label'),
					dataType: availableProperty.getProperty('data_type')
				});
			}
			return properties;
		}
	});
});
