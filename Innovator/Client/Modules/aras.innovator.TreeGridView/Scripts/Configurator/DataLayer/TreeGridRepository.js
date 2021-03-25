define(['dojo/aspect'], function (aspect) {
	'use strict';
	var TreeGridRepository = (function () {
		function TreeGridRepository(
			viewDefinition,
			queryDefinition,
			moduleFactory
		) {
			this._queryDefinition = queryDefinition;
			this._viewDefinition = viewDefinition;
			this._moduleFactory = moduleFactory;
			this._combiningModule = moduleFactory.getCombiningModule(
				viewDefinition,
				queryDefinition
			);
			this._intellisense = moduleFactory.getIntellisenseModule(queryDefinition);
			this._validation = moduleFactory.getValidationModule(
				viewDefinition,
				queryDefinition,
				this._intellisense
			);
			this._identificatorFilter = moduleFactory.getIdentificatorFilter();
		}
		TreeGridRepository.prototype.getCurrentBranch = function () {
			return this._currentBranch;
		};
		TreeGridRepository.prototype.setCurrentTreeBranch = function () {
			var mainBranch = this.getTreeBranchWithValidateColumnMapping();
			this._currentBranch = mainBranch;
			return mainBranch;
		};
		TreeGridRepository.prototype.getTreeBranchWithValidateColumnMapping = function () {
			var branchBuilder = this._moduleFactory.getBranchBuilder(
				this._viewDefinition,
				this._queryDefinition
			);
			var branches = branchBuilder.getExistingBranches();
			var mainBranch = this._mergeBranches(branches);
			this._validation.validateColumnMappings(mainBranch);
			var queryDefinitionFilter = this._moduleFactory.getQueryDefinitionFilter(
				this._viewDefinition,
				this._queryDefinition
			);
			queryDefinitionFilter.applyQueryDefinitionFilter(mainBranch);
			this._identificatorFilter.apply(mainBranch);
			return mainBranch;
		};
		TreeGridRepository.prototype.getQbCellTemplateValuesForAlias = function (
			graphNode,
			alias
		) {
			return this._intellisense.getQbCellTemplateValuesForAlias(
				graphNode,
				alias,
				this._currentBranch
			);
		};
		TreeGridRepository.prototype.mapTreeRow = function (
			graphNodeId,
			columnDefinition
		) {
			// TODO replace on private variable
			var mapper = this._moduleFactory.getTreeGridMapper(
				this._viewDefinition,
				this._queryDefinition,
				this._currentBranch
			);

			var self = this;
			// mapTreeRow implementation contains recursive call for recursion root item so we add afterAspect to create column mapping for it
			aspect.after(
				mapper,
				'mapTreeRow',
				function (nodeId) {
					self.createEmptyColumnMapping(nodeId, columnDefinition);
				},
				true
			);

			mapper.mapTreeRow(graphNodeId);
		};
		TreeGridRepository.prototype.multipleMap = function (
			graphNodeIds,
			columnDefinition
		) {
			var self = this;
			var uniqueIds = this._getUniqueNodeIds(graphNodeIds);
			uniqueIds.forEach(function (id) {
				var node = self._currentBranch.getNodeByUniqueIdentificator(id);
				if (node.isCandidate) {
					self.mapTreeRow(node.id, columnDefinition);
					self.setCurrentTreeBranch();
				}
			});
		};
		TreeGridRepository.prototype._getUniqueNodeIds = function (graphNodeIds) {
			var uniqueIds = [];
			var self = this;
			graphNodeIds.forEach(function (id) {
				var node = self._currentBranch.getNodeById(id);
				if (node && node.uniqueIdentificator) {
					uniqueIds.push(node.uniqueIdentificator);
				}
			});
			return uniqueIds;
		};
		TreeGridRepository.prototype.unmapTreeRow = function (graphNodeId) {
			// TODO replace on private variable
			var mapper = this._moduleFactory.getTreeGridMapper(
				this._viewDefinition,
				this._queryDefinition,
				this._currentBranch
			);
			mapper.unmapTreeRow(graphNodeId);
		};
		TreeGridRepository.prototype.multipleUnmap = function (graphNodeIds) {
			var self = this;
			var uniqueIds = this._getUniqueNodeIds(graphNodeIds);
			uniqueIds.forEach(function (id) {
				var node = self._currentBranch.getNodeByUniqueIdentificator(id);
				var joinedNodes = self._currentBranch.getJoinedNodes(node);
				if (joinedNodes.length === 0) {
					if (!node.isCandidate && !node.isGroup) {
						self.unmapTreeRow(node.id);
						self.setCurrentTreeBranch();
					}
				}
			});
		};
		TreeGridRepository.prototype.combineNodes = function (
			joinNodeIds,
			columnDefinition
		) {
			this._combiningModule.combineNodes(joinNodeIds, this._currentBranch);
			if (joinNodeIds.length) {
				this.createEmptyColumnMapping(joinNodeIds[0], columnDefinition);
			}
		};
		TreeGridRepository.prototype.decombineNodes = function (
			graphNodeId,
			columnDefinition
		) {
			this._combiningModule.decombineNodes(graphNodeId, this._currentBranch);
			this.createEmptyColumnMapping(graphNodeId, columnDefinition);
		};
		TreeGridRepository.prototype.canCombineNodes = function (joinNodeIds) {
			if (joinNodeIds.length < 2) {
				return false;
			}
			return this._combiningModule.canCombineNodes(
				joinNodeIds,
				this._currentBranch
			);
		};
		TreeGridRepository.prototype.validateViewDefinition = function () {
			return this._validation.validateViewDefinition();
		};
		TreeGridRepository.prototype._mergeBranches = function (brachArray) {
			var mainBranch;
			if (brachArray.length > 0) {
				mainBranch = brachArray[0];
				var mainRoot = mainBranch.getRootNode();
				for (var i = 1; i < brachArray.length; i++) {
					var currentBranch = brachArray[i];
					var currentRoot = currentBranch.getRootNode();
					this._mergeBranchesRecursive(
						mainBranch,
						currentBranch,
						mainRoot,
						currentRoot
					);
				}
			} else {
				mainBranch = this._moduleFactory.getNewBranch();
			}
			return mainBranch;
		};
		TreeGridRepository.prototype._mergeBranchesRecursive = function (
			sourceBranch,
			destBranch,
			sourceNode,
			destNode
		) {
			var sourceChildren = sourceBranch.getChildNodes(sourceNode);
			var destChildren = destBranch.getChildNodes(destNode);
			function filter(destChild) {
				return function (obj) {
					return obj.queryItemRefId === destChild.queryItemRefId;
				};
			}
			for (var j = 0; j < destChildren.length; j++) {
				var destChild = destChildren[j];
				var resArray = sourceChildren.filter(filter(destChild));
				if (resArray.length > 0) {
					this._mergeBranchesRecursive(
						sourceBranch,
						destBranch,
						resArray[0],
						destChild
					); // recursion call
				} else {
					sourceBranch.copyFromBranch(destBranch, destChild, sourceNode); // copy to main
				}
			}
		};
		TreeGridRepository.prototype.isNodeCanBeMapped = function (graphNode) {
			if (graphNode.isCandidate) {
				if (!graphNode.isRecursiveNode) {
					return true;
				} else {
					return graphNode.recursionNodeMapped ? false : true;
				}
			}
			return false;
		};
		TreeGridRepository.prototype.isNodeCanBeUnMapped = function (
			graphNode,
			canUnmapCombining
		) {
			if (graphNode.isCandidate || graphNode.isGroup) {
				return false;
			}
			if (this._currentBranch.getJoinedNodes(graphNode).length > 0) {
				// we can't unmaped combining row
				return canUnmapCombining;
			}
			var childNodes = this._currentBranch.getChildNodes(graphNode);
			var rootNode = this._currentBranch.getRootNode();
			if (rootNode.id !== graphNode.id) {
				var groupChildNodes = childNodes.filter(function (obj) {
					return obj.isGroup;
				});
				if (groupChildNodes.length > 0) {
					return false;
				}
			}
			return true;
		};
		TreeGridRepository.prototype.insertGroupBetweenParent = function (
			graphNodeId,
			template
		) {
			var node = this._currentBranch.getNodeById(graphNodeId);
			if (node.treeRowRefId) {
				var childRow = this._viewDefinition.getTreeRowByRefId(
					node.treeRowRefId
				);
				var parentRow = this._viewDefinition.getParentRowDefinition(
					node.treeRowRefId
				);
				var rowReference = this._viewDefinition.getReferenceByChild(
					node.treeRowRefId
				);
				var groupRowDefinition;
				if (parentRow) {
					groupRowDefinition = this._viewDefinition.createTreeRowDefinition(
						undefined
					);
					this._viewDefinition.insertTreeRowBetween(
						groupRowDefinition,
						parentRow,
						childRow,
						rowReference.viewOrder
					);
				} else {
					// we support only insert group between candidate if candidate is root
					groupRowDefinition = this._viewDefinition.createTreeRowDefinition(
						undefined
					);
					this._viewDefinition.insertTreeRowBefore(
						groupRowDefinition,
						childRow.refId,
						rowReference.viewOrder
					);
				}
			}
		};
		TreeGridRepository.prototype.insertGroupBelow = function (
			graphNodeId,
			template
		) {
			var node = this._currentBranch.getNodeById(graphNodeId);
			if (node.treeRowRefId) {
				var sortOrder = this._getSortOrderForInsertGroupBelow(node);
				var newTreeRow = this._viewDefinition.createTreeRowDefinition(
					undefined
				);
				this._viewDefinition.insertTreeRowAfter(
					newTreeRow,
					node.treeRowRefId,
					sortOrder
				);
			}
		};
		TreeGridRepository.prototype._getSortOrderForInsertGroupBelow = function (
			node
		) {
			var sortOrder = 128;
			if (node.treeRowRefId) {
				var childReferences = this._viewDefinition.getChildRowReferences(
					node.treeRowRefId
				);
				if (childReferences.length > 0) {
					sortOrder = childReferences[childReferences.length - 1].viewOrder;
				}
			}
			return sortOrder;
		};
		TreeGridRepository.prototype.getParentGraphNode = function (nodeId) {
			return this._currentBranch.getParentNode(nodeId);
		};
		TreeGridRepository.prototype.getChildGraphNodes = function (nodeId) {
			var parentNode = this._currentBranch.getNodeById(nodeId);
			return this._currentBranch.getChildNodes(parentNode);
		};
		TreeGridRepository.prototype.isNodeHasChildRecursiveNode = function (
			nodeId
		) {
			var childNodes = this.getChildGraphNodes(nodeId);
			for (var i = 0; i < childNodes.length; i++) {
				if (childNodes[i].isRecursiveNode) {
					return true;
				}
			}
			return false;
		};
		TreeGridRepository.prototype.getRootNode = function () {
			return this._currentBranch.getRootNode();
		};
		TreeGridRepository.prototype.getColumnMappingForTreeRow = function (
			rowRefId
		) {
			return this._viewDefinition.getColumnsMappingForTreeRow(rowRefId);
		};
		TreeGridRepository.prototype.getColumnMapping = function (
			graphNode,
			columnDefinition
		) {
			var rowColumnMappings = this._viewDefinition.getColumnsMappingForTreeRow(
				graphNode.treeRowRefId
			);
			var columnMapping = rowColumnMappings.reduceRight(function (a, c) {
				return c.sourceId === columnDefinition.id ? c : a;
			}, null);
			return columnMapping;
		};
		TreeGridRepository.prototype.createColumnMapping = function (
			graphNode,
			columnDefinition
		) {
			return this._viewDefinition.createColumnMapping(
				graphNode.treeRowRefId,
				columnDefinition.id
			);
		};
		TreeGridRepository.prototype.addOrUpdateColumnMapping = function (
			columnMapping
		) {
			this._viewDefinition.updateColumnMapping(columnMapping);
		};
		TreeGridRepository.prototype.createColumn = function () {
			return this._viewDefinition.createColumnDefinition();
		};
		TreeGridRepository.prototype.insertColumn = function (
			afterColumn,
			newColumn
		) {
			this._viewDefinition.insertColumnDefinition(afterColumn, newColumn);
			var reCalculatedColumns = this._viewDefinition.getAllColumnDefinitions();
			return reCalculatedColumns;
		};
		TreeGridRepository.prototype.updateColumn = function (column) {
			this._viewDefinition.updateColumnDefinition(column);
		};
		TreeGridRepository.prototype.getColumns = function () {
			var columnDefinitions = this._viewDefinition.getAllColumnDefinitions();
			return columnDefinitions;
		};
		TreeGridRepository.prototype.removeColumn = function (column) {
			this._viewDefinition.removeColumnDefinition(column.id);
			var reCalculatedColumns = this._viewDefinition.getAllColumnDefinitions();
			return reCalculatedColumns;
		};
		TreeGridRepository.prototype.getColumnDefinitionItem = function (column) {
			return this._viewDefinition.getColumnDefItem(column.id);
		};
		TreeGridRepository.prototype.renameColumn = function (column, updatedItem) {
			this._viewDefinition.renameColumnDefinition(column, updatedItem);
		};
		TreeGridRepository.prototype.getIconUrl = function (graphNode) {
			if (graphNode.hasMappingErrors) {
				return '../Images/RedWarning.svg';
			}
			var groupIconUrl = '../images/Folder.svg';
			if (graphNode.isGroup) {
				return groupIconUrl;
			}
			var iconUrl = null;
			if (!graphNode.isCandidate) {
				var treeColumnDefinition = this.getColumns()[0];
				var columnMapping = this.getColumnMapping(
					graphNode,
					treeColumnDefinition
				);
				iconUrl = this._getColumnMappingTemplateIconUrl(columnMapping);

				if (
					columnMapping &&
					columnMapping.template &&
					columnMapping.template.icon
				) {
					var matches = columnMapping.template.icon.match(/\{[\s\S]*?}/);

					if (matches) {
						return '../images/IconTemplate.svg';
					}
				}
			}
			if (iconUrl === null) {
				var joinedNodes = this._currentBranch.getJoinedNodes(graphNode);
				if (joinedNodes.length > 0) {
					iconUrl = '../images/CombinedElement.svg';
				} else {
					var queryItem = this._queryDefinition.getQueryItem(
						graphNode.queryItemRefId
					);
					iconUrl = this._getItemTypeIconUrl(queryItem.itemType);
				}
			}
			return iconUrl;
		};
		TreeGridRepository.prototype.getAliasesForNode = function (
			graphNode,
			ignoreRecursion
		) {
			return this._intellisense.getAliasesForNode(
				graphNode,
				ignoreRecursion,
				this._currentBranch
			);
		};
		TreeGridRepository.prototype._getItemTypeIconUrl = function (itemTypeInfo) {
			var defaultItemTypeIconUrl = '../images/DefaultItemType.svg';
			var defaultRelationshipTypeIconUrl = '../images/RelationshipType.svg';
			var itemType = aras.getItemTypeForClient(itemTypeInfo.name);
			if (itemType.isError() || itemType.isEmpty()) {
				return null;
			}
			var itemTypeIconUrl = itemType.getProperty('open_icon', null);
			if (!itemTypeIconUrl) {
				if (itemType.getProperty('is_relationship') === '1') {
					itemTypeIconUrl = defaultRelationshipTypeIconUrl;
				} else {
					itemTypeIconUrl = defaultItemTypeIconUrl;
				}
			}
			return itemTypeIconUrl;
		};
		TreeGridRepository.prototype._getColumnMappingTemplateIconUrl = function (
			columnMapping
		) {
			if (
				!(
					columnMapping &&
					columnMapping.template &&
					columnMapping.template.icon
				)
			) {
				return null;
			}
			var iconUrlOrTemplate = columnMapping.template.icon;
			if (typeof iconUrlOrTemplate !== 'string') {
				return null;
			}
			var iconUrl = this._transformIconTemplateToUrl(iconUrlOrTemplate);
			return iconUrl;
		};
		TreeGridRepository.prototype._transformIconTemplateToUrl = function (
			iconUrlOrTemplate
		) {
			var templateIconUrl = '';
			var iconUrl = this._isIconTemplate(iconUrlOrTemplate)
				? templateIconUrl
				: iconUrlOrTemplate;
			return iconUrl;
		};
		TreeGridRepository.prototype._isIconTemplate = function (
			iconTemplateChallenger
		) {
			return /^{.*}$/.test(
				iconTemplateChallenger.trim().replace(/[\r\n]/g, '')
			);
		};
		TreeGridRepository.prototype._getDefaultDataTemplate = function (
			graphNode
		) {
			var qbAliases = this.getAliasesForNode(graphNode, false);
			var alias = qbAliases.length && qbAliases[0];
			if (!alias) {
				return;
			}
			var templates = this.getQbCellTemplateValuesForAlias(graphNode, alias);
			var idReference = 'INVALID_ID_VALUE';
			if (templates.indexOf('id') > -1) {
				idReference = '{' + alias + '.id}';
			}
			var queryItem = this._queryDefinition.getQueryItem(
				graphNode.queryItemRefId
			);
			return (
				'{"id": "' +
				idReference +
				'", "type": "' +
				queryItem.itemType.name +
				'"}'
			);
		};
		TreeGridRepository.prototype.createEmptyColumnMapping = function (
			graphNodeId,
			columnDefinition
		) {
			var graphNode = this._currentBranch.getNodeById(graphNodeId);

			if (graphNode.isRecursiveNode) {
				return;
			}
			var columnMapping = this._viewDefinition.createColumnMapping(
				graphNode.treeRowRefId,
				columnDefinition.id
			);
			columnMapping.dataTemplate = this._getDefaultDataTemplate(graphNode);
			this.addOrUpdateColumnMapping(columnMapping);
		};
		return TreeGridRepository;
	})();
	return TreeGridRepository;
});
