(function () {
	const pathToResource = '../Modules/aras.innovator.ExtendedClassification/';
	const infernoFlags = ArasModules.utils.infernoFlags;
	const relationshipIdPrefix = 'R_';
	const relationshipNamePrefix = '[R]';

	const AnyXClass = new XClass('any_classification');
	Object.defineProperty(AnyXClass, 'name', {
		get: function () {
			if (!this._name) {
				this._name = aras.getResource(
					pathToResource,
					'xClassSearchControl.xClass.any_classification'
				);
			}
			return this._name;
		}
	});
	AnyXClass.checkbox.orderStates = [
		XClassSearchCheckbox.States.STATE_DEFAULT,
		XClassSearchCheckbox.States.STATE_HARD_CHECKED,
		XClassSearchCheckbox.States.STATE_HARD_UNCHECKED
	];
	Object.assign(AnyXClass, {
		setChildrenState: function (state) {
			xClassSearchControl.allXClasses.forEach(
				function (xClass) {
					xClass.setCheckboxState(state);
				}.bind(this)
			);
		},
		getAml: function (itemTypeName, relationshipTypeName, currentQueryItem) {
			let generalQuery;
			if (
				this.checkbox.state === XClassSearchCheckbox.States.STATE_HARD_CHECKED
			) {
				generalQuery = '<OR xClassSearchCriteria="1">';
				if (
					relationshipTypeName &&
					xClassSearchControl.relationshipXClasses.size > 0
				) {
					generalQuery +=
						'<Relationships>' +
						'<Item type="' +
						relationshipTypeName +
						'_xClass" action="get">' +
						'<related_id condition="is not null"/>' +
						'</Item>' +
						'</Relationships>';
				}
				if (xClassSearchControl.xClasses.size > 0) {
					const query =
						'<Relationships>' +
						'<Item type="' +
						itemTypeName +
						'_xClass" action="get">' +
						'<related_id condition="is not null"/>' +
						'</Item>' +
						'</Relationships>';
					if (relationshipTypeName) {
						generalQuery +=
							'<related_id>' +
							'<Item type="' +
							itemTypeName +
							'" action="get">' +
							'<AND>' +
							query +
							'</AND>' +
							'</Item>' +
							'</related_id>';
					} else {
						generalQuery += query;
					}
				}
				generalQuery += '</OR>';
			} else if (
				this.checkbox.state === XClassSearchCheckbox.States.STATE_HARD_UNCHECKED
			) {
				generalQuery = '<NOT xClassSearchCriteria="1"><OR>';
				if (
					relationshipTypeName &&
					xClassSearchControl.relationshipXClasses.size > 0
				) {
					generalQuery +=
						'<id condition="in" by="source_id">' +
						'<Item type="' +
						relationshipTypeName +
						'_xClass" action="get">' +
						'<related_id condition="is not null" />' +
						'</Item>' +
						'</id>';
				}
				if (xClassSearchControl.xClasses.size > 0) {
					const query =
						'<Item type="' +
						itemTypeName +
						'_xClass" action="get">' +
						'<related_id condition="is not null" />' +
						'</Item>';
					if (relationshipTypeName) {
						generalQuery +=
							'<related_id condition="in" by="source_id">' +
							query +
							'</related_id>';
					} else {
						generalQuery +=
							'<id condition="in" by="source_id">' + query + '</id>';
					}
				}

				generalQuery += '</OR></NOT>';
			}
			if (generalQuery) {
				const queryXmlDoc = aras.createXMLDocument();
				queryXmlDoc.loadXML(generalQuery);
				currentQueryItem.appendChild(queryXmlDoc.documentElement);
				return currentQueryItem.xml;
			}
		},
		parseItemAml: function (query, itemTypeName, relationshipItemTypeName) {
			const queryElement = aras.createXMLDocument();
			queryElement.loadXML(query.xml);
			let answer = false;
			let checkedXPath =
				'//OR[@xClassSearchCriteria="1"]/Relationships/Item/related_id[@condition="is not null"]';
			let uncheckedXPath =
				'//NOT[@xClassSearchCriteria="1"]/OR/id[@condition="in" and @by="source_id"]/' +
				'Item[contains(@type,"_xClass")]/related_id[@condition="is not null"]';

			if (relationshipItemTypeName) {
				checkedXPath +=
					'|//OR[@xClassSearchCriteria="1"]/related_id/Item[@type="' +
					itemTypeName +
					'"]/AND/Relationships/Item/related_id[@condition="is not null"]';
				uncheckedXPath =
					'//NOT[@xClassSearchCriteria="1"]/OR/*[(local-name() = "id" or local-name() = "related_id")' +
					' and @condition="in" and @by="source_id"]/Item[contains(@type,"_xClass")]/related_id[@condition="is not null"]';
			}

			if (queryElement.selectSingleNode(checkedXPath)) {
				answer = true;
				this.setCheckboxState(XClassSearchCheckbox.States.STATE_HARD_CHECKED);
			} else if (queryElement.selectSingleNode(uncheckedXPath)) {
				answer = true;
				this.setCheckboxState(XClassSearchCheckbox.States.STATE_HARD_UNCHECKED);
			} else {
				this.setCheckboxState(XClassSearchCheckbox.States.STATE_DEFAULT);
			}
			return answer;
		},
		getFormatterData: function () {
			const titleFormatter = {
				tag: 'div',
				className: 'checkbox-title',
				children: [this.name],
				style: {
					'margin-left': '25px'
				}
			};
			return {
				className: 'aras-grid-row-cell_boolean',
				children: [
					{
						tag: 'div',
						children: [titleFormatter]
					},
					this.checkbox.formatter
				]
			};
		}
	});

	const xClassSearchControl = {
		xClasses: new Map(),
		relationshipXClasses: new Map(),
		get allXClasses() {
			const allXClasses = new Map();
			this.xClasses.forEach(function (value, key) {
				allXClasses.set(key, value);
			});
			this.relationshipXClasses.forEach(function (xClass, id) {
				allXClasses.set(id, xClass);
			});
			return allXClasses;
		},
		init: function (xClassTrees, relationshipXClassTrees) {
			const combineStateOldXClassWithNew = function () {
				const oldXClasses = this.allXClasses;
				return function () {
					if (
						!oldXClasses ||
						!this.allXClasses ||
						oldXClasses.size === 0 ||
						this.allXClasses.size === 0
					) {
						return;
					}
					oldXClasses.forEach(
						function (oldXClass, id) {
							const xClass = this.allXClasses.get(id);
							if (xClass) {
								xClass.isFiltered = oldXClass.isFiltered;
							}
						}.bind(this)
					);
				}.bind(this);
			}.bind(this)();
			this.xClasses = this.parseXClasses(xClassTrees);
			if (relationshipXClassTrees) {
				const relationshipXClasses = this.parseXClasses(
					relationshipXClassTrees
				);
				relationshipXClasses.forEach(
					function (xClass) {
						const id = relationshipIdPrefix + xClass.id;
						xClass.name = relationshipNamePrefix + ' ' + xClass.name;
						xClass.isRelationship = true;
						this.relationshipXClasses.set(id, xClass);
					}.bind(this)
				);
			}
			combineStateOldXClassWithNew();
			this.initGridData(this.allXClasses);
		},
		setSearchFilter: function (filterState) {
			this.clearFoundXClasses();
			if (filterState) {
				this.visibleXClass = filterState.filter();
				this.currentSearchFilter = filterState;
				if (filterState === xClassSearchFilters.ALL) {
					this.isFilteredMode = false;
				} else {
					this.isFilteredMode = true;
				}
			}
		},
		initGrid: function (container) {
			this.grid = new Grid(container, { multiSelect: false });
			this.grid.getCellType = function () {
				return 'xClass';
			};
			Grid.formatters.xClass = function (headId, rowId, value, grid) {
				const xClass = grid.rows.get(rowId);
				return xClass.getFormatterData(xClassSearchControl.isFilteredMode);
			};
			this.grid.on(
				'click',
				function (rowId, event) {
					if (event.target.tagName !== 'INPUT') {
						const xClass = this.grid.rows.get(rowId);
						if (event.target.closest('.filter') && this.canClickableFilters) {
							const filterBlock = event.target.closest('.filter');
							xClass.toogleFilter();
							if (xClass.isFiltered) {
								filterBlock.classList.add('apply-filter');
							} else {
								filterBlock.classList.remove('apply-filter');
							}
						} else if (
							event.target.closest('.aras-form-boolean') &&
							this.supportXClassSearch &&
							xClass.checkbox.state !==
								XClassSearchCheckbox.States.STATE_SOFT_CHECKED &&
							xClass.checkbox.state !==
								XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED
						) {
							xClass.nextStateCheckbox();
						}
						this.grid.render();
					}
				}.bind(this),
				'row'
			);

			const contextMenu = new ArasModules.ContextMenu(xClassSearchWrapper.node);
			contextMenu.on(
				'click',
				function (menuItemId, e, rowId) {
					const state = XClassSearchCheckbox.States.getStateByClassName(
						menuItemId
					);
					const xClass = this.grid.rows.get(rowId);
					xClass.setCheckboxState(state);
					this.grid.render();
					columnSelectionControl.node.parentElement.focus();
				}.bind(this)
			);

			this.grid.on(
				'contextmenu',
				function (rowId, event) {
					if (
						event.target.closest('.aras-form-boolean') &&
						this.supportXClassSearch
					) {
						event.preventDefault();
						const xClass = this.grid.rows.get(rowId);
						if (
							xClass.checkbox.state ==
								XClassSearchCheckbox.States.STATE_SOFT_CHECKED ||
							xClass.checkbox.state ==
								XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED
						) {
							return false;
						}
						const data = {};
						xClass.checkbox.orderStates.forEach(function (state) {
							if (xClass.checkbox.state != state) {
								const span = Inferno.createVNode(
									Inferno.getFlagsForElementVnode('span'),
									'span',
									null,
									null,
									infernoFlags.hasInvalidChildren,
									{
										onClick: function (e) {
											e.target.parentElement.click();
										}
									}
								);
								data[state.class] = {
									label: [span, state.label]
								};
							}
						});
						contextMenu.applyData(data);
						const clickPosition = { top: event.pageY, left: event.pageX };
						const docSize = {
							width: document.documentElement.clientWidth,
							height: document.documentElement.clientHeight,
							scrollLeft: document.documentElement.scrollLeft,
							scrollTop: document.documentElement.scrollTop
						};
						contextMenu.dom.style.visibility = 'hidden';
						return contextMenu
							.show({ x: 0, y: 0 }, rowId)
							.then(
								function () {
									const menuRect = contextMenu.dom.getBoundingClientRect();
									const parentNodeRect = xClassSearchWrapper.node.parentNode.getBoundingClientRect();

									let x = clickPosition.left;
									if (x + menuRect.width > docSize.width + docSize.scrollLeft) {
										x = clickPosition.left - menuRect.width;
									}
									let y = clickPosition.top;
									if (
										y + menuRect.height >
										docSize.height + docSize.scrollTop
									) {
										y = docSize.height - menuRect.height;
									}

									x = x - parentNodeRect.left;
									y = y - parentNodeRect.top;

									return contextMenu.show({ x: x, y: y }, rowId);
								}.bind(this)
							)
							.then(
								function () {
									contextMenu.dom.style.visibility = '';
									contextMenu.dom.focus();
								}.bind(this)
							);
					}
				}.bind(this),
				'row'
			);
		},
		set visibleXClass(xClassesId) {
			this.grid.settings.indexRows = xClassesId;
			this.grid.render();
			let show = false;
			if (this.grid.settings.indexRows.length === 0) {
				show = true;
			}
			xClassSearchWrapper.showNotFound(show);
		},
		get visibleXClass() {
			return this.grid.settings.indexRow;
		},
		initGridData: function (xClasses) {
			const head = new Map();
			const rows = new Map();
			head.set('col1', {
				label: 'Column1',
				width: '100%',
				resize: true
			});

			rows.set(AnyXClass.id, AnyXClass);
			xClasses.forEach(function (xClass, id) {
				rows.set(id, xClass);
			});

			xClassSearchControl.grid.head = head;
			xClassSearchControl.grid.rows = rows;
			this.grid.rows.get = function (key, prop) {
				const value = this._store.get(key);
				if (value) {
					if (prop) {
						return value[prop];
					}
					return value;
				}
			};
		},
		parseXClasses: function (xClassTrees) {
			const xClasses = new Map();
			const setXClassesRecursive = function (refId, refObj, edges, level) {
				const childrenRefs = edges[refId];
				const xClass = refObj[refId];
				xClass.level = level;
				xClasses.set(xClass.id, xClass);
				if (childrenRefs && childrenRefs.length > 0) {
					childrenRefs.forEach(function (childRef) {
						setXClassesRecursive(childRef, refObj, edges, level + 1);
						xClass.addChildXClass(
							refObj[childRef],
							xClassSearchControl.logicState
						);
					});
				}
			};
			xClassTrees.forEach(function (xClassTree) {
				const hierarchy = JSON.parse(
					aras.getItemProperty(xClassTree, 'classification_hierarchy')
				);
				const xClassesItems = ArasModules.xml.selectNodes(
					xClassTree,
					'.//Item[@type="xClass"]'
				);
				const xClassTreeId = xClassTree.getAttribute('id') || '';
				const refObjItem = {};
				const edges = {};
				xClassesItems.forEach(function (xClassItem) {
					const name =
						aras.getItemProperty(xClassItem, 'label') ||
						aras.getItemProperty(xClassItem, 'name');
					const ref_id = aras.getItemProperty(xClassItem, 'ref_id');
					const id = aras.getItemProperty(xClassItem, 'id');
					refObjItem[ref_id] = new XClass(id, name, xClassTreeId);
				});
				hierarchy.forEach(function (edge) {
					const from = edge.fromRefId || 'roots';
					const to = edge.toRefId;
					if (!edges[from]) {
						edges[from] = [];
					}
					edges[from].push(to);
				});
				edges.roots.forEach(function (root) {
					setXClassesRecursive(root, refObjItem, edges, 1);
				});
			});
			return xClasses;
		},
		search: function (text) {
			const searchXClasses = [];
			this.allXClasses.forEach(function (xClass, id) {
				if (xClass.isNameContains(text)) {
					searchXClasses.push(id);
				}
			});
			this.visibleXClass = searchXClasses;
			this.isFilteredMode = true;
		},
		clearFoundXClasses: function () {
			this.grid.settings.indexRows.forEach(
				function (rowId) {
					const xClass = this.grid.rows.get(rowId);
					xClass.clearSearchData();
				}.bind(this)
			);
		},
		clearFilters: function () {
			this.allXClasses.forEach(function (xClass) {
				xClass.isFiltered = false;
			});
			this.grid.render();
		},
		getQueryAml: function () {
			if (
				(!this.xClasses || this.xClasses.size === 0) &&
				(!this.relationshipXClasses || this.relationshipXClasses.size === 0)
			) {
				return this.currentSearchQuery.xml;
			}

			let amlQuery =
				AnyXClass.getAml(
					itemTypeName,
					relationshipItemTypeName,
					this.currentSearchQuery
				) || '';
			if (amlQuery) {
				return amlQuery;
			}

			const queryXml = aras.createXMLDocument();
			let nodeToInsert = queryXml.appendChild(
				queryXml.createElement(this.logicState.tagName)
			);
			let relatedItemNode = null;
			let includeRelshipXClassSearchCriteria = false;
			let includeXClassSearchCriteria = false;
			if (relationshipItemTypeName) {
				this.relationshipXClasses.forEach(function (xClass) {
					if (
						xClass.checkbox.state.getAml(
							nodeToInsert,
							xClass.id,
							relationshipItemTypeName,
							this.logicState
						) &&
						!includeRelshipXClassSearchCriteria
					) {
						includeRelshipXClassSearchCriteria = true;
					}
				}, this);
				relatedItemNode = queryXml.createElement('related_id');
				nodeToInsert = relatedItemNode.appendChild(
					queryXml.createElement('Item')
				);
				nodeToInsert.setAttribute('type', itemTypeName);
				nodeToInsert.setAttribute('action', 'get');
				nodeToInsert = nodeToInsert.appendChild(
					queryXml.createElement(this.logicState.tagName)
				);
			}
			this.xClasses.forEach(function (xClass) {
				if (
					xClass.checkbox.state.getAml(
						nodeToInsert,
						xClass.id,
						itemTypeName,
						this.logicState
					) &&
					!includeXClassSearchCriteria
				) {
					includeXClassSearchCriteria = true;
				}
			}, this);

			if (relationshipItemTypeName && includeXClassSearchCriteria) {
				queryXml.documentElement.appendChild(relatedItemNode);
			}

			if (includeRelshipXClassSearchCriteria || includeXClassSearchCriteria) {
				queryXml.documentElement.setAttribute('xClassSearchCriteria', '1');
				this.currentSearchQuery.appendChild(queryXml.documentElement);
			}

			return this.currentSearchQuery.xml;
		},
		parseQuery: function (query) {
			this.currentSearchQuery = query;
			if (
				(!this.xClasses || this.xClasses.size === 0) &&
				(!this.relationshipXClasses || this.relationshipXClasses.size === 0)
			) {
				return;
			}

			const isQueryAnyXClass = AnyXClass.parseItemAml(
				query,
				itemTypeName,
				relationshipItemTypeName
			);
			if (!isQueryAnyXClass) {
				const xClassSearchCriteria = query.selectSingleNode(
					'//node()[@xClassSearchCriteria="1"]'
				);
				if (xClassSearchCriteria) {
					if (
						xClassSearchCriteria.tagName.toUpperCase() ===
						XClassSearchCheckbox.LogicStates.AND.tagName.toUpperCase()
					) {
						this.logicState = XClassSearchCheckbox.LogicStates.AND;
					} else if (
						xClassSearchCriteria.tagName.toUpperCase() ===
						XClassSearchCheckbox.LogicStates.OR.tagName.toUpperCase()
					) {
						this.logicState = XClassSearchCheckbox.LogicStates.OR;
					}
					const setStateByXClassIds = function (ids, xClasses, state, prefix) {
						ids.forEach(function (id) {
							if (prefix) {
								id = prefix + id;
							}
							const xClass = xClasses.get(id);
							if (xClass) {
								xClass.setCheckboxState(state);
							}
						});
					};
					Object.keys(XClassSearchCheckbox.States).forEach(function (
						checkboxStateKey
					) {
						const checkboxState = XClassSearchCheckbox.States[checkboxStateKey];
						const ids = checkboxState.getXClassesIdByMarkerState.call(
							checkboxState,
							xClassSearchCriteria,
							this.logicState,
							itemTypeName,
							relationshipItemTypeName
						);
						const relationshipsIds = checkboxState.getXClassesIdByMarkerState.call(
							checkboxState,
							xClassSearchCriteria,
							this.logicState,
							relationshipItemTypeName,
							relationshipItemTypeName
						);
						setStateByXClassIds(ids, this.xClasses, checkboxState);
						setStateByXClassIds(
							relationshipsIds,
							this.relationshipXClasses,
							checkboxState,
							relationshipIdPrefix
						);
					},
					this);
				}
			}

			if (this.supportXClassSearch) {
				this.clearXClassSearchCriteria(this.currentSearchQuery);
			}
		},
		getQueryForXClassBar: function () {
			const searchTips = [];
			const logicStateLabel = aras.getResource(
				pathToResource,
				'xClassSearchControl.xclassbar.checkbox.logic.' +
					this.logicState.tagName
			);
			if (
				AnyXClass.checkbox.state ===
				XClassSearchCheckbox.States.STATE_HARD_CHECKED
			) {
				const label = aras.getResource(
					pathToResource,
					'xClassSearchControl.xclassbar.checkbox.all_checked'
				);
				searchTips.push('<mark>' + label + '</mark>');
			} else if (
				AnyXClass.checkbox.state ===
				XClassSearchCheckbox.States.STATE_HARD_UNCHECKED
			) {
				const label = aras.getResource(
					pathToResource,
					'xClassSearchControl.xclassbar.checkbox.all_unchecked'
				);
				searchTips.push('<mark>' + label + '</mark>');
			} else {
				this.allXClasses.forEach(function (xClass) {
					switch (xClass.checkbox.state) {
						case XClassSearchCheckbox.States.STATE_CHECKED:
						case XClassSearchCheckbox.States.STATE_UNCHECKED:
						case XClassSearchCheckbox.States.STATE_HARD_CHECKED:
						case XClassSearchCheckbox.States.STATE_HARD_UNCHECKED:
							if (searchTips.length > 0) {
								searchTips.push(logicStateLabel);
							}
							const checkboxStateLabel = aras.getResource(
								pathToResource,
								'xClassSearchControl.xclassbar.checkbox.' +
									xClass.checkbox.state.class,
								'<mark>' + xClass.name + '</mark>'
							);
							searchTips.push(checkboxStateLabel);
							break;
					}
				});
			}
			return searchTips.join(' ');
		},
		clearXClassSearchCriteria: function (queryNode) {
			const xClassSearchCriteria = queryNode.selectSingleNode(
				'//node()[@xClassSearchCriteria="1"]'
			);
			if (xClassSearchCriteria) {
				queryNode.removeChild(xClassSearchCriteria);
			}
		},
		updateOrderCheckboxes: function () {
			this.allXClasses.forEach(
				function (xClass) {
					xClass.checkbox.generateOrderStates(
						xClass.children.length > 0,
						this.logicState === XClassSearchCheckbox.LogicStates.AND
					);
				}.bind(this)
			);
			this.grid.render();
		},
		AnyXClass: AnyXClass
	};

	window.xClassSearchControl = xClassSearchControl;
})();
