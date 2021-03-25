(function (wnd) {
	var xPropertiesUtils = {
		isItemTypeAllowedOnTree: function (itemTypeId) {
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			var iTNodes = treesData.selectSingleNode(
				'Item[@type="xClassificationTree" and (Relationships/Item[@type="xClassificationTree_ItemType"]/' +
					'related_id/Item[@type="ItemType" and @id="' +
					itemTypeId +
					'"] or Relationships/Item[@type="xClassificationTree_ItemType"]' +
					'/related_id="' +
					itemTypeId +
					'")]'
			);

			return !!iTNodes;
		},
		getXClassificationTreesForItemType: function (itemTypeId) {
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			return ArasModules.xml.selectNodes(
				treesData,
				'Item[@type="xClassificationTree" and (Relationships/Item[@type="xClassificationTree_ItemType"]/' +
					'related_id/Item[@type="ItemType" and @id="' +
					itemTypeId +
					'"] or Relationships/Item[@type="xClassificationTree_ItemType"]' +
					'/related_id="' +
					itemTypeId +
					'")]'
			);
		},
		getClassificationHierarchyByClassId: function (xClassId, isRepeatCall) {
			let isRepeatCallForxClass = isRepeatCall;
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			var xClassNd = treesData.selectSingleNode(
				'Item[@type="xClassificationTree"]/Relationships/Item[@type="xClass" and @id="' +
					xClassId +
					'"]'
			);

			if (xClassNd == null) {
				if (isRepeatCallForxClass) {
					var errorMessage = aras.getResource(
						'../Modules/aras.innovator.ExtendedClassification/',
						'xClassesControl.invalid_xclass_on_item'
					);
					return aras.AlertError(errorMessage).then(function () {
						return Promise.reject(errorMessage);
					});
				} else {
					aras.MetadataCache.DeleteXClassificationTreesDates();

					return this.getClassificationHierarchyByClassId(xClassId, true);
				}
			}

			var parentTreeNd = xClassNd.parentNode.parentNode;
			var classificationHierarchy = JSON.parse(
				wnd.aras.getItemProperty(parentTreeNd, 'classification_hierarchy')
			);
			return {
				hierarchy: classificationHierarchy,
				classRefId: wnd.aras.getItemProperty(xClassNd, 'ref_id'),
				treeId: parentTreeNd.getAttribute('id')
			};
		},
		getParentXClassesInHierarchy: function (data) {
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			var refIds = [data.classRefId];

			var hierarchyNode;
			var toRefId = data.classRefId;

			var findHandler = function (elt) {
				return elt.toRefId === toRefId;
			};
			hierarchyNode = data.hierarchy.find(findHandler);
			while (hierarchyNode) {
				if (hierarchyNode.fromRefId) {
					refIds.push(hierarchyNode.fromRefId);
					toRefId = hierarchyNode.fromRefId;
					hierarchyNode = data.hierarchy.find(findHandler);
				} else {
					hierarchyNode = null;
				}
			}

			var refIdStatement = refIds
				.map(function (refId) {
					return 'ref_id="' + refId + '"';
				})
				.join(' or ');
			var xClassNodes = ArasModules.xml.selectNodes(
				treesData,
				'Item[@type="xClassificationTree" and @id="' +
					data.treeId +
					'"]/Relationships/Item[@type="xClass" and (' +
					refIdStatement +
					')]'
			);

			return xClassNodes.map(function (xClass) {
				return xClass.getAttribute('id');
			});
		},
		getXPropertiesByClasses: function (xClassIds) {
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			var xClassesSelectStatement = xClassIds
				.map(function (e) {
					return '@id="' + e + '"';
				})
				.join(' or ');
			return ArasModules.xml.selectNodes(
				treesData,
				'Item[@type="xClassificationTree"]/Relationships/Item[@type="xClass" and (' +
					xClassesSelectStatement +
					')]/Relationships/Item[@type="xClass_xPropertyDefinition"]/related_id/Item'
			);
		},
		getXPropertiesForXClasses: function (classIds) {
			var result = {};
			classIds.forEach(
				function (classId) {
					var hierarchyData = this.getClassificationHierarchyByClassId(classId);
					var classWithParents = this.getParentXClassesInHierarchy(
						hierarchyData
					);
					result[classId] = this.getXPropertiesByClasses(classWithParents);
				}.bind(this)
			);
			return result;
		},
		getJSON: function (xPropertiesHash) {
			var result = [];
			var xClassIds = Object.keys(xPropertiesHash);
			xClassIds.forEach(
				function (xClassId) {
					result.push(this.getXClassJSON(xClassId, xPropertiesHash[xClassId]));
				}.bind(this)
			);

			return result;
		},
		getXClassJSON: function (xClassId, xPropertyCollection) {
			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();
			var result = {};
			var xClassNode = treesData.selectSingleNode(
				'Item[@type="xClassificationTree"]/Relationships/Item[@type="xClass" and @id="' +
					xClassId +
					'"]'
			);
			var sortOrderString = wnd.aras.getItemProperty(
				xClassNode,
				'xproperties_sort_order'
			);

			result.id = xClassId;
			result.label =
				wnd.aras.getItemProperty(xClassNode, 'label') ||
				wnd.aras.getItemProperty(xClassNode, 'name');
			result.properties = xPropertyCollection.reduce(
				function (result, xPropertyNode) {
					if (
						wnd.aras.getItemProperty(
							xPropertyNode.parentNode.parentNode,
							'inactive'
						) !== '1'
					) {
						result.push(this.getXPropertyJSON(xPropertyNode));
					}
					return result;
				}.bind(this),
				[]
			);

			if (sortOrderString) {
				var sortOrderArr = sortOrderString.split(',');
				var sortOrderJSON = {};
				sortOrderArr.forEach(function (key, idx) {
					sortOrderJSON[key] = idx + 1;
				});

				result.properties = result.properties.sort(function (prop1, prop2) {
					return sortOrderJSON[prop1.id] < sortOrderJSON[prop2.id] ? -1 : 1;
				});
			}

			return result;
		},
		getXPropertyJSON: function (xPropertyNode) {
			var result = {};
			var relationshipNode = xPropertyNode.parentNode.parentNode;

			result.id = xPropertyNode.getAttribute('id');
			result.dataSource = wnd.aras.getItemProperty(
				xPropertyNode,
				'data_source',
				null
			);
			result.name = wnd.aras.getItemProperty(xPropertyNode, 'name');
			result.type = wnd.aras.getItemProperty(xPropertyNode, 'data_type');
			result.pattern = wnd.aras.getItemProperty(xPropertyNode, 'pattern');
			result.prec = wnd.aras.getItemProperty(xPropertyNode, 'prec');
			result.scale = wnd.aras.getItemProperty(xPropertyNode, 'scale');
			result.helpTooltip = wnd.aras.getItemProperty(
				xPropertyNode,
				'help_tooltip'
			);
			result.privatePermissionBehavior = wnd.aras.getItemProperty(
				xPropertyNode,
				'private_permission_behavior'
			);

			// overridable properties
			result.isInactive =
				+wnd.aras.getItemProperty(relationshipNode, 'inactive') === 1;
			result.isReadonly =
				+wnd.aras.getItemProperty(relationshipNode, 'readonly') === 1;
			result.isRequired =
				+wnd.aras.getItemProperty(relationshipNode, 'is_required') === 1;
			result.default_value = wnd.aras.getItemProperty(
				relationshipNode,
				'default_value',
				null
			);
			result.label =
				wnd.aras.getItemProperty(relationshipNode, 'label', null) ||
				wnd.aras.getItemProperty(xPropertyNode, 'name');

			if (
				result.type === 'list' ||
				result.type === 'color list' ||
				result.type === 'mv_list'
			) {
				result.values = this.getListValues(result.dataSource);
			}

			return result;
		},
		getMetadataForXClassesControl: function (xClassIds) {
			var hash = this.getXPropertiesForXClasses(
				this.sortXClassIdsAccordingWithTrees(xClassIds)
			);
			return this.getJSON(hash);
		},
		getListValues: function (listId) {
			var res = wnd.aras.MetadataCache.GetList([listId], []);
			var listValues = ArasModules.xml.selectNodes(
				res.getResult(),
				'Item/Relationships/Item'
			);
			return listValues.map(function (valueNd) {
				return {
					label: wnd.aras.getItemProperty(valueNd, 'label'),
					value: wnd.aras.getItemProperty(valueNd, 'value')
				};
			});
		},
		getParentClassesChain: function (xClass, tree) {
			var childToParentIds = {};
			var hieararchy = JSON.parse(
				aras.getItemProperty(tree, 'classification_hierarchy')
			);
			hieararchy.forEach(function (edge) {
				childToParentIds[edge.toRefId] = edge.fromRefId;
			});
			var parentChain = [];
			var getParentId = function (childId) {
				var parentId = childToParentIds[childId];
				if (parentId) {
					var xClass = tree.selectSingleNode(
						"Relationships/Item[ref_id='" + parentId + "']"
					);
					parentChain.push(xClass);
					getParentId(parentId);
				}
			};
			getParentId(aras.getItemProperty(xClass, 'ref_id'));
			return parentChain;
		},
		getSortOrderForProperties: function (xClass, tree, xProps, deletedXProps) {
			var parentXClassChain = this.getParentClassesChain(xClass, tree);
			deletedXProps = deletedXProps || [];
			Array.prototype.forEach.call(deletedXProps, function (deletedXProp) {
				aras.setItemProperty(
					deletedXProp.selectSingleNode('related_id/Item'),
					'sort_order',
					''
				);
			});
			var sortOrder = aras.getItemProperty(xClass, 'xproperties_sort_order');
			if (!sortOrder) {
				sortOrder = parentXClassChain.reduceRight(function (prev, curr) {
					var sortOrder = aras.getItemProperty(curr, 'xproperties_sort_order');
					if (!prev && sortOrder) {
						return sortOrder;
					}
					return prev;
				}, null);
			}
			if (sortOrder) {
				var sortOrderArr = sortOrder.split(',');
				sortOrder = {};
				sortOrderArr.forEach(function (key, idx) {
					sortOrder[key] = idx;
				});
			}
			var propIdToSort = {};
			var unsortedProps = Array.prototype.reduce.call(
				xProps,
				function (prev, curr) {
					var sortIdx =
						sortOrder &&
						sortOrder[
							aras.getItemProperty(
								curr.selectSingleNode('related_id/Item'),
								'id'
							)
						];
					if (Number.isInteger(sortIdx)) {
						propIdToSort[aras.getItemProperty(curr, 'id')] = sortIdx;
					} else {
						prev.push(curr);
					}
					return prev;
				},
				[]
			);

			var chainIds = parentXClassChain
				.map(function (item) {
					aras.getItemRelationshipsEx(item, 'xClass_xPropertyDefinition');
					return aras.getItemProperty(item, 'id');
				})
				.reverse();
			unsortedProps.sort(function (a, b) {
				var sourceA = tree.selectSingleNode(
					'Relationships/Item[Relationships/Item[@id="' +
						aras.getItemProperty(a, 'id') +
						'"]]'
				);
				var sourceB = tree.selectSingleNode(
					'Relationships/Item[Relationships/Item[@id="' +
						aras.getItemProperty(b, 'id') +
						'"]]'
				);
				var idxA = chainIds.indexOf(aras.getItemProperty(sourceA, 'id'));
				var idxB = chainIds.indexOf(aras.getItemProperty(sourceB, 'id'));
				var levelA = idxA === -1 ? chainIds.length : idxA;
				var levelB = idxB === -1 ? chainIds.length : idxB;
				var relatedA = a.selectSingleNode('related_id/Item');
				var relatedB = b.selectSingleNode('related_id/Item');
				var labelA =
					aras.getItemProperty(relatedA, 'label') ||
					aras.getItemProperty(relatedA, 'name');
				var labelB =
					aras.getItemProperty(relatedB, 'label') ||
					aras.getItemProperty(relatedB, 'name');

				if (levelA < levelB) {
					return -1;
				}
				if (levelA > levelB) {
					return 1;
				}
				if (labelA < labelB) {
					return -1;
				}
				if (labelA > labelB) {
					return 1;
				}
				return 0;
			});

			var sortedCount = xProps.length - unsortedProps.length;
			unsortedProps.forEach(function (xProp, idx) {
				propIdToSort[aras.getItemProperty(xProp, 'id')] = sortedCount + idx;
			});
			return propIdToSort;
		},
		sortXClassIdsAccordingWithTrees: function (xClassIds) {
			var lastXClassIndex = 0;
			var xClassesHash = {};

			var getTreeXClassIds = function (tree) {
				var hierarchy = aras.getItemProperty(tree, 'classification_hierarchy');
				if (!hierarchy) {
					return;
				}
				var treeStructure = JSON.parse(hierarchy);
				var edges = {};
				treeStructure.forEach(function (edge) {
					var from = edge.fromRefId || 'roots';
					var to = edge.toRefId;
					if (!edges[from]) {
						edges[from] = [];
					}
					edges[from].push(to);
				});

				var xClassRefToId = {};

				ArasModules.xml
					.selectNodes(tree, './Relationships/Item[@type="xClass"]')
					.reduce(function (res, xClassNd) {
						res[
							wnd.aras.getItemProperty(xClassNd, 'ref_id')
						] = xClassNd.getAttribute('id');
						return res;
					}, xClassRefToId);

				var linearizeXClasses = function (parentRefId) {
					xClassesHash[xClassRefToId[parentRefId]] = lastXClassIndex++;
					var children = edges[parentRefId] || [];

					children.forEach(function (childId) {
						if (edges[childId]) {
							linearizeXClasses(childId);
						} else {
							xClassesHash[xClassRefToId[childId]] = lastXClassIndex++;
						}
					});
				};

				edges.roots.forEach(function (rootId) {
					linearizeXClasses(rootId);
				});
			};

			if (!Array.isArray(xClassIds) && xClassIds.forEach) {
				// if Set was received need convert it to Array
				var xClassIdsArray = [];
				xClassIds.forEach(function (id) {
					xClassIdsArray.push(id);
				});
				xClassIds = xClassIdsArray;
			} else {
				// to avoid source array changes
				xClassIds = xClassIds.slice();
			}

			var treesData = wnd.aras.MetadataCache.GetAllXClassificationTrees();

			var trees = ArasModules.xml.selectNodes(
				treesData,
				'./Item[@type="xClassificationTree"]'
			);

			trees.forEach(function (tree) {
				getTreeXClassIds(tree);
			});

			xClassIds.sort(function (id1, id2) {
				return xClassesHash[id1] < xClassesHash[id2] ? -1 : 1;
			});

			return xClassIds;
		},
		getSetOfXPropertiesNamesForXClasses: function (xClassIds) {
			var hash = this.getXPropertiesForXClasses(xClassIds);
			var result = new Set();

			xClassIds.forEach(function (xClassId) {
				hash[xClassId].forEach(function (xPropDefNd) {
					result.add(aras.getItemProperty(xPropDefNd, 'name'));
				});
			});

			return result;
		},
		deleteUndefinedXPropertiesFromItem: function (item) {
			var relationshipType = item.getAttribute('type') + '_xClass';
			var relationships = item.selectNodes(
				'Relationships/Item[@type="' +
					relationshipType +
					'" and not(@action="delete") and not(@action="skip")]'
			);
			var iomItem = aras.newIOMItem();
			var xClassIDs = Array.prototype.map.call(relationships, function (
				relationship
			) {
				iomItem.node = relationship;
				return iomItem.getRelatedItemID();
			});

			var xPropertiesNamesSet = this.getSetOfXPropertiesNamesForXClasses(
				new Set(xClassIDs)
			);
			xPropNodes = ArasModules.xml.selectNodes(
				item,
				'./*[starts-with(name(),"xp-")]'
			);
			xPropNodes.forEach(function (xPropNode) {
				if (!xPropertiesNamesSet.has(xPropNode.nodeName)) {
					xPropNode.parentNode.removeChild(xPropNode);
				}
			});
		},
		getItemXClassIds: function (item) {
			var result = [];
			var relationshipType = item.getAttribute('type') + '_xClass';
			var relationships = ArasModules.xml.selectNodes(
				item,
				'Relationships/Item[@type="' +
					relationshipType +
					'" and (not(@action="delete") and not(@action="skip"))]'
			);
			relationships.forEach(function (relNode) {
				var id = aras.getItemProperty(relNode, 'related_id');
				result.push(id);
			});

			return result;
		},
		sortXClassRelationships: function (item) {
			var relationshipType = item.getAttribute('type') + '_xClass';
			var relationshipsNode = ArasModules.xml.selectSingleNode(
				item,
				'Relationships'
			);
			var relationships = ArasModules.xml.selectNodes(
				item,
				'Relationships/Item[@type="' + relationshipType + '" and @action="add"]'
			);

			// reverse array to save initial sorting
			relationships.reverse();

			relationships.forEach(function (relshipNode) {
				relationshipsNode.insertBefore(
					relshipNode,
					relationshipsNode.firstChild
				);
			});
		},
		checkPropertiesBeforeItemSave: function (item, xClassesControl) {
			var propertiesForCheck = [];
			var xClassesIds = this.getItemXClassIds(item);
			var propertiesData = this.getMetadataForXClassesControl(xClassesIds);

			propertiesData.forEach(function (xClassData) {
				xClassData.properties.forEach(function (propertyData) {
					if (
						propertyData.isRequired &&
						item.selectSingleNode(propertyData.name + '[@is_null=0]') ===
							null &&
						aras.getItemProperty(item, propertyData.name) === ''
					) {
						propertiesForCheck.push({
							name: propertyData.name,
							label: propertyData.label,
							default_value: propertyData.default_value
						});
					}
				});
			});

			var errorMessage = null;
			var errorProperty = propertiesForCheck.find(function (propertyData) {
				return propertyData.default_value === undefined;
			});

			if (errorProperty) {
				return aras
					.AlertError(
						aras.getResource(
							'',
							'item_methods_ex.field_required_provide_value',
							errorProperty.label
						)
					)
					.then(function () {
						return false;
					});
			} else {
				for (var i = 0; i < propertiesForCheck.length; i++) {
					var propertyData = propertiesForCheck[i];

					var ask = aras.confirm(
						aras.getResource(
							'',
							'item_methods_ex.field_required_default_will_be_used',
							propertyData.label,
							propertyData.default_value
						)
					);
					if (ask) {
						aras.setItemProperty(
							item,
							propertyData.name,
							propertyData.default_value
						);
						xClassesControl.setPropertyValue(
							propertyData.name,
							propertyData.default_value
						);
					} else {
						return Promise.resolve(false);
					}
				}
			}

			xPropertiesUtils.deleteUndefinedXPropertiesFromItem(item);

			return Promise.resolve(true);
		},
		refreshInitXPropertiesValues: function (item, initPropsHash) {
			Object.keys(initPropsHash).forEach(function (key) {
				delete initPropsHash[key];
			});
			var propsToSelect = [];

			var setPropertyInitialValue = function (propNode, initPropsHash) {
				if (propNode.getAttribute('is_null') === '0') {
					initPropsHash[propNode.nodeName + '@restricted'] = true;
				} else if (propNode.getAttribute('is_null') === '1') {
					initPropsHash[propNode.nodeName] = null;
				} else {
					initPropsHash[propNode.nodeName] = propNode.text;
				}
			};

			var itemXClassIDs = xPropertiesUtils.getItemXClassIds(item);
			var xClassXPropertiesData = xPropertiesUtils.getMetadataForXClassesControl(
				itemXClassIDs
			);
			xClassXPropertiesData.forEach(function (xClassData) {
				xClassData.properties.forEach(function (propertyData) {
					if (propertyData.default_value) {
						initPropsHash[propertyData.name] = propertyData.default_value;
					}
				});
			});

			ArasModules.xml
				.selectNodes(item, './*[starts-with(name(),"xp-")]')
				.forEach(function (propNode) {
					if (
						propNode.getAttribute('set') &&
						propNode.getAttribute('set').indexOf('value') !== -1 &&
						item.getAttribute('isTemp') !== '1'
					) {
						propsToSelect.push(propNode.nodeName);
					} else if (
						!(
							propNode.getAttribute('set') &&
							propNode.getAttribute('set').indexOf('value') !== -1
						)
					) {
						setPropertyInitialValue(propNode, initPropsHash);
					}
				});

			if (propsToSelect.length) {
				return ArasModules.soap(
					'<Item type="' +
						item.getAttribute('type') +
						'" action="get" id="' +
						item.getAttribute('id') +
						'" select="' +
						propsToSelect.join() +
						'" />',
					{ async: true }
				).then(function (resp) {
					ArasModules.xml
						.selectNodes(resp, 'Item/*[starts-with(name(),"xp-")]')
						.forEach(function (propNode) {
							setPropertyInitialValue(propNode, initPropsHash);
						});
				});
			}

			return Promise.resolve();
		},
		refreshInitXPropertiesPermissions: function (
			item,
			initPropsHash,
			needRequest
		) {
			if (needRequest) {
				const itemProperties = this.getDefinedXProperties(item);
				let itemWithAllXProps = new Item(item.getAttribute('type'), 'get');
				itemWithAllXProps.setAttribute('id', item.getAttribute('id'));
				itemWithAllXProps.setAttribute(
					'select',
					itemProperties
						.map(function (property) {
							return property.name + '(@permission_id)';
						})
						.join(',')
				);
				itemWithAllXProps = itemWithAllXProps.apply();
				if (!itemWithAllXProps.isEmpty() && !itemWithAllXProps.isError()) {
					item = itemWithAllXProps.node;
				}
			}
			Object.keys(initPropsHash).forEach(function (key) {
				delete initPropsHash[key];
			});
			ArasModules.xml
				.selectNodes(item, './*[starts-with(name(),"xp-")]')
				.forEach(function (xPropNode) {
					initPropsHash[xPropNode.tagName] = xPropNode.getAttribute(
						'permission_id'
					);
				});
		},
		getXClassesForItem: function (item, relationshipType) {
			const relationships = item.selectNodes(
				'Relationships/Item[@type="' + relationshipType + '"]'
			);
			const iomItem = aras.newIOMItem();
			const removedXClasses = new Set();
			const xClassIDs = Array.prototype.map.call(relationships, function (
				relationship
			) {
				iomItem.node = relationship;
				var id = iomItem.getRelatedItemID();

				if (
					relationship.getAttribute('action') === 'delete' ||
					relationship.getAttribute('action') === 'skip'
				) {
					removedXClasses.add(id);
				}

				return id;
			});

			return {
				xClassIDs: xClassIDs,
				removedXClasses: removedXClasses
			};
		},
		getDefinedXProperties: function (item) {
			const currentType = item.getAttribute('type');
			const relationshipType = currentType + '_xClass';

			const xClassesInfo = this.getXClassesForItem(item, relationshipType);
			const metadata = this.getJSON(
				this.getXPropertiesForXClasses(xClassesInfo.xClassIDs)
			);
			const itemProperties = metadata
				.map(function (xClass) {
					return xClass.properties;
				})
				.reduce(function (a, b) {
					return a.concat(b);
				}, []);
			return itemProperties;
		}
	};

	wnd.xPropertiesUtils = xPropertiesUtils;
})(window);
