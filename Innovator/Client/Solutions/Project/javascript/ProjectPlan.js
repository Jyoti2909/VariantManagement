const ProjectPlan = {
	init: function(item) {
		this.projectItem = item;
		this.projectId = item.getAttribute('id');
		this.projectItemType = item.getAttribute('type');
		this.projectNumber = aras.getItemProperty(item, 'project_number');
		this.projectBaseUrl = aras.getScriptsURL() + '../Solutions/Project/';
		this.savedSearchResults = new Set();

		aras.getItemRelationships('Project', this.projectId, 'Project Team');

		const self = this;
		return this._initQueryDom().then(function() {
			const toolbarInitialized = self._initToolbar();
			const projectViewsLoaded = self._loadProjectViewsList();
			const columnsInitialized = self._initColumns();
			return Promise.all([toolbarInitialized, projectViewsLoaded, columnsInitialized]);
		});
	},

	getTreeLoadXml: function(level) {
		level = level || treeLevelsConst;
		uniCache.queryDom
			.selectSingleNode('Item/Relationships/Item[@type="Sub WBS" and @repeatTimes]')
			.setAttribute('repeatTimes', level + 1);

		return uniCache.queryDom;
	},

	initActNums: function() {
		const projectItem = this.projectItem;
		const activityNumbersQuery = '<Item type="Method" action="getActivitiesNumbers"><rootWBS>' + wbsId + '</rootWBS></Item>';
		const applyResult = actNums ? Promise.resolve() : ArasModules.soap(activityNumbersQuery);
		return applyResult.then(function(resultNode) {
			if (resultNode) {
				actNums = resultNode.firstChild;
			}

			if (projectItem.selectSingleNode('wbs_id//Item[@action]')) {
				mergeActNums();
			}

			prepareActNums();
		});
	},

	initTreeLoadXml: function() {
		const propsHash = {};
		this.columns.forEach(function(col) {
			if (col.isSystem) {
				return;
			}

			const columnSources = Object.keys(col.sources);
			columnSources.forEach(function(source) {
				propsHash[col.sources[source].val] = propsHash[col.sources[source].val] | (source === wbsRowType ? 1 : source === actRowType || source === milRowType ? 2 : 0);
			});
		});

		const treeLoadXml = ArasModules.xml.parseString(uniCache.queryDom.xml);
		const hashProperties =  Object.keys(propsHash);
		for (let i = 0; i < hashProperties.length; i++) {
			const property = hashProperties[i];
			const propertyParts = property.split('/');

			if (propertyParts.length !== 2) {
				return aras.AlertError(aras.getResource('project', 'project_tree.wrong_property_data_source', property));
			}

			const itemType = propertyParts[0];
			const propertyName = propertyParts[1];
			const itemNode = treeLoadXml.selectSingleNode('//Item[@type="' + itemType + '"]');

			if (itemNode) {
				let selectValue = itemNode.getAttribute('select');
				if (selectValue.indexOf(propertyName) === -1) {
					selectValue += ', ' + propertyName;
					itemNode.setAttribute('select', selectValue);
				}
			} else if (itemType === 'Deliverable') {
				let xPath = '//Item';
				switch (propsHash[property]) {
					case 1:
						xPath += '[@type="WBS Deliverable"]';
						break;
					case 2:
						xPath += '[@type="Activity2 Deliverable"]';
						break;
					case 3:
						xPath += '[@type="WBS Deliverable" or @type="Activity2 Deliverable"]';
						break;
					default:
						return aras.AlertError(aras.getResource('project', 'project_tree.wrong_value_of_propshash'));
				}

				const foundItems = treeLoadXml.selectNodes(xPath);
				for (let i = 0; i < foundItems.length; i++) {
					this._addPropToRelated(itemNode, propertyName);
				}
			}
		}

		uniCache.queryDom = treeLoadXml;
	},

	loadXMLAsync: function(fileName, xmlType) {
		const projectBaseUrl = this.projectBaseUrl;
		return new Promise(function(resolve, reject) {
			const xhr = new XMLHttpRequest();
			const url = xmlType ? aras.getI18NXMLResource(fileName, projectBaseUrl) : projectBaseUrl + fileName;
			xhr.open('GET', url);
			xhr.onload = function() {
				resolve(xhr.responseText);
			};
			xhr.onerror = function() {
				reject(xhr.statusText);
			};
			xhr.send();
		})
		.then(ArasModules.xml.parseString);
	},

	updateCustomActionsMenu: function(selectedItemId) {
		let RTActions;
		const relationshipTypeActions = this.relationshipTypeActions;
		if (selectedItemId) {
			const itemType = treeGrid._grid.rows.get(selectedItemId, 'type');
			RTActions = relationshipTypeActions[itemType];
		} else {
			RTActions = relationshipTypeActions.actionsOfTypeItemType;
		}

		if (RTActions) {
			const toolbarItem = this.toolbar.getItem('actions_menu');
			toolbarItem.removeAll();

			const actions = Object.keys(RTActions);
			actions.forEach(function(actionName) {
				toolbarItem.Add(actionName, RTActions[actionName]);
			});
		}
	},

	_addPropToRelated: function(itemNode, propertyName) {
		let selectValue = itemNode.getAttribute('select');
		selectValue = selectValue.replace(/related_id(?:\((.*?)\))?|$/, function($1, $2) {
			const result = $2 ? ($2 + ',' + propertyName) : propertyName;
			return ($1 ? '' : ',') + 'related_id(' + result + ')';
		});
		itemNode.setAttribute('select', selectValue);
	},

	_initColumns: function() {
		const self = this;
		return this._loadColumnsPreferences().then(function(columnItems) {
			const getColumnSources = function(sources, descriptionItem) {
				const rowType = aras.getItemProperty(descriptionItem, 'row_type');
				const dataSource = aras.getItemProperty(descriptionItem, 'data_source');
				sources[rowType] = {
					val: dataSource,
					xpath: getXPathForColumnSource(rowType, dataSource),
					params: getParamsForColumnSource(dataSource)
				};

				return sources;
			};

			self.columns = columnItems.map(function(columnItem) {
				const descriptionItems = ArasModules.xml.selectNodes(columnItem, 'Relationships/Item[@type="PM_ProjectColumnDescription"]');
				return {
					isSystem: aras.getItemProperty(columnItem, 'is_system') === '1',
					label: aras.getItemProperty(columnItem, 'label'),
					name: aras.getItemProperty(columnItem, 'name'),
					sources: descriptionItems.reduce(getColumnSources, {}),
					width: aras.getItemProperty(columnItem, 'width')
				};
			});
		});
	},

	_initCustomMenuActions: function() {
		this.relationshipTypeActions = ['WBS Element', 'Activity2'].reduce(function(typedActions, itemType) {
			const itemTypeNode = aras.getItemTypeDictionary(itemType).node;
			typedActions[itemType] = ['itemtype', 'item'].reduce(function(actions, type) {
				const actionNodes = ArasModules.xml.selectNodes(itemTypeNode, 'Relationships/Item[@type="Item Action"]/related_id/Item[type="' + type + '" and name]');
				const isItemType = type === 'itemtype';
				actionNodes.forEach(function(actionNode) {
					const actionId = actionNode.getAttribute('id');
					const actionLabel = aras.getItemProperty(actionNode, 'label') || aras.getItemProperty(actionNode, 'name');
					actions[actionId] = actionLabel;

					if (isItemType) {
						typedActions.actionsOfTypeItemType[actionId] = actionLabel;
					}
				});

				return actions;
			}, {});

			return typedActions;
		}, {actionsOfTypeItemType: {}});
	},

	_initToolbar: function() {
		const toolbar = new ToolbarWrapper({
			connectId: 'toolbarContainer',
			useCompatToolbar: true
		});

		toolbar.buttonClick = onToolbarButtonClick;
		this.toolbar = toolbar;
		return this._loadToolbarData();
	},

	_initQueryDom: function() {
		const treeXMLPath = this.projectItemType === 'Project' ? 'query.xml' : 'queryTemplate.xml';
		return this.loadXMLAsync(treeXMLPath, true).then(function(queryDom) {
			uniCache.queryDom = queryDom;
		});
	},

	_loadColumnsPreferences: function() {
		let preference;
		if (this.projectItemType === 'Project') {
			const prefKey = aras.CreateCacheKey('Project Preference', '0A75EDA113F14432B058E781BAC5E65E');
			const cachedPreference = aras.MetadataCache.GetItem(prefKey);

			if (cachedPreference) {
				preference = Promise.resolve(cachedPreference.content);
			} else {
				const xml = '' +
					'<Item type="Preference" action="get">' +
						'<identity_id>' +
							'<Item type="Identity">' +
								'<name>World</name>' +
							'</Item>' +
						'</identity_id>' +
						'<Relationships>' +
							'<Item type="PM_ProjectGridLayout" action="get" select="name,label,width,is_system" orderBy="position">' +
								'<Relationships>' +
									'<Item type="PM_ProjectColumnDescription" select="row_type,data_source" />' +
								'</Relationships>' +
							'</Item>' +
						'</Relationships>' +
					'</Item>';

				preference = ArasModules.soap(xml).then(function(resultNode) {
					const resDom = aras.createXMLDocument();
					resDom.loadXML(resultNode.firstChild.xml);
					const preferenceItem = resDom.selectSingleNode("/Item[@type='Preference']");
					const cacheablePreferences = aras.IomFactory.CreateCacheableContainer(preferenceItem, preferenceItem);
					aras.MetadataCache.SetItem(prefKey, cacheablePreferences);
					return preferenceItem;
				});
			}
		} else {
			preference = this.loadXMLAsync('projectGridLayoutXML.xml', true)
				.then(function(preferenceItem) {
					return preferenceItem.firstChild;
				});
		}

		return preference.then(function(preferenceItem) {
			return ArasModules.xml.selectNodes(preferenceItem, 'Relationships/Item');
		});
	},

	_loadProjectViewsList: function() {
		const self = this;
		const requiredViewNode = this.projectItemType === 'Project' ? '//projectview' : '//templateview';
		this.projectViewConfigurations = {};

		return this.loadXMLAsync('projectViews.xml', true).then(function(project) {
			ArasModules.xml
				.selectNodes(project, requiredViewNode)
				.forEach(function(viewNode) {
					const viewId = viewNode.getAttribute('id');
					const panels = ArasModules.xml
						.selectNodes(viewNode, './/panel')
						.map(function(panelNode) {
							return {
								name: panelNode.getAttribute('name'),
								type: panelNode.getAttribute('type'),
								width: panelNode.getAttribute('width'),
								toggle: panelNode.getAttribute('toggle') === 'true',
								visible: panelNode.getAttribute('visible') === 'true'
							};
						});

					self.projectViewConfigurations[viewId] = {
						id: viewId,
						panels: panels
					};
				});
		});
	},

	_loadToolbarData: function() {
		const typeOfProject = this.projectItemType === 'Project';
		const toolbarData = typeOfProject ? 'projectTree_toolbar.xml' : 'projectTemplateTree_toolbar.xml';

		return this.loadXMLAsync(toolbarData, true).then(function(toolbarItem) {
			const toolbarWrapper = this.toolbar;
			toolbarWrapper.loadToolbarFromStr(toolbarItem.xml);
			toolbarWrapper.show();
			toolbarWrapper.disable();

			const toolbar = toolbarWrapper._toolbar;
			toolbar.on('change', function(itemId) {
				const targetItem = toolbarWrapper.getItem(itemId);
				onToolbarItemChange(targetItem);
			});

			toolbar.on('dropDownItemClick', function(itemId, event) {
				onToolbarDropDownItemClick(event.detail.optionId);
			});

			const ignoredButtons = new Set(['gantt_task_float',	'gantt_completion_progress', 'gantt_dependency_links']);
			toolbar.data.forEach(function(item) {
				if (item.type === 'separator' || (item.type === 'button' && !ignoredButtons.has(item.id))) {
					viewShare.variables.menuActions.push({ id: item.id, label: item.tooltip, type: item.type });
				}
			});

			if (typeOfProject) {
				commonMenuActions = commonMenuActions.concat([
					'saved_search_project_tree',
					'execute_scheduling',
					'print',
					'show_gantt_chart',
					'gantt_time_delta',
					'gantt_dependency_links',
					'gantt_completion_progress',
					'gantt_task_float'
				]);
				const savedSearches = aras.getSavedSearches('ProjectTreeSalt_klj43', 'ProjectTree');
				const toolbarSavedSearches = toolbarWrapper.getItem('saved_search_project_tree');

				toolbarSavedSearches.Add('emptySavedSearchProject', '');
				savedSearches.forEach(function(savedSearch) {
					const searchId = aras.getItemProperty(savedSearch, 'id');
					const searchLabel = aras.getItemProperty(savedSearch, 'label');
					toolbarSavedSearches.Add(searchId, searchLabel);
				});
				toolbarSavedSearches.setSelected('emptySavedSearchProject');
				this.savedSearches = savedSearches;
			}
		}.bind(this));
	}
};
