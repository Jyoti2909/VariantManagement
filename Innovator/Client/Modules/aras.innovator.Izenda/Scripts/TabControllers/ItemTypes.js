require([
	'dojo/dom-style',
	'Aras/Client/Controls/Experimental/Tree',
	'dojo/_base/declare',
	'dojo/on',
	'dijit/dijit',
	'dojo/text!Izenda/Views/Tabs/ItemTypes.html',
	'dojo/query',
	'dojo/dom-attr'
], function (domStyle, tree, declare, on, dijit, template, query, domAttr) {
	var aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;

	function getItemTypeLabel(itemType) {
		return itemType.getProperty('label') || itemType.getProperty('name');
	}

	function getItemType(id) {
		return aras.getItemTypeForClient(id, 'id');
	}

	var xTemplateHelper = {
		removeXmlHeaders: function (xml) {
			return xml.replaceAll('<result>').replaceAll('</result>');
		},
		getItemTypeTreeXml: function (id, args, itemTypeLabel, whereClause) {
			var itemType = aras.getItemTypeForClient(id, 'id');
			var itemTypeName = itemType.getProperty('instance_data');
			var label =
				itemTypeLabel ||
				itemType.getProperty('label') ||
				itemType.getProperty('name');
			var isRelationship =
				itemType.getProperty('is_relationship') == '0' ? false : true;
			var icon = (
				itemType.getProperty('large_icon') ||
				itemType.getProperty('small_icon') ||
				(isRelationship
					? '/images/RelationshipType.svg'
					: '/images/DefaultItemType.svg')
			).replace('..', '');

			var res = format(
				jq$('#baseItemTypeXml').html(),
				label,
				this.getRelatedTypesXml(id, args.itemTypeMode()),
				this.xsltItemTree(
					format(jq$('#amlSelectItemTypeProps').html(), id, whereClause),
					'itemTypesToTreeGrid.xsl',
					args.itemTypeMode()
				),
				'',
				'',
				icon,
				'',
				id,
				itemType.getProperty('name')
			);

			// remember about either InnovatorClientUrl for full URL or Tree.IconPath setting
			res = this.removeXmlHeaders(
				res
					.replaceAll('$baseType', itemTypeName)
					.replaceAll('%InnovatorClientUrl%', args.clientUrl)
			).replaceAll('<tr ', '\r\n<tr '); // solve debug problems with long non-breaked string
			return res;
		},
		getRelatedTypesXml: function (id, itemTypeMode) {
			return this.xsltItemTree(
				format(jq$('#amlSelectRelated').html(), id),
				'relatedTypesToTreeGrid.xsl',
				itemTypeMode
			).replaceAll('$nodeType', 0);
		},
		xsltItemTree: function (xml, xsltUrl, itemTypeMode) {
			let amlXml = aras.applyAML(xml);
			let s = '';
			if (amlXml) {
				if (amlXml.indexOf('<Result>') !== 0) {
					amlXml = '<Result>' + amlXml + '</Result>';
				}
				const doc = aras.createXMLDocument();
				doc.loadXML(amlXml.replaceAll('<Item ', '\r\n<Item '));
				s = aras.applyXsltFile(
					doc.documentElement,
					aras.getScriptsURL() +
						'../Modules/aras.innovator.Izenda/Styles/' +
						xsltUrl
				);
			}
			return s;
		}
	};
	var self;
	var ItemTypesTab = declare(Izenda.UI.Tab.Base, {
		templateString: template,
		baseItemLeftTree: null,
		baseItemTypeTree: null,
		rightTree: null,
		name: null,

		onResize: function () {
			var searchContainerOffsetHeight = 0;
			if (this.baseItemTypeTree && this.baseItemTypeTree.baseItemTypes) {
				searchContainerOffsetHeight = this.baseItemTypeTree.searchContainer
					.offsetHeight;
				this.baseItemTypeTree.baseItemTypes.style.height =
					500 -
					5 -
					(this.leftTreeLabel.offsetHeight + searchContainerOffsetHeight) +
					'px';
			}
			this.baseItemLeftTree._tree.containerNode.style.height =
				500 -
				5 -
				(this.leftTreeLabel.offsetHeight + searchContainerOffsetHeight) +
				'px';
		},

		constructor: function (args) {
			this.args = args;
			this.name = this.args.name;
			this.ssrSetting = {};
		},

		init: function () {
			self = this;
			this.initSsrSettings();
			this.baseItemTypesList = this.getBaseItemTypes(this.args.itemTypeMode());
			this.initBaseItemTypeTree();
			this.initItemTypeModesButtons();
			this.initBreadcrumbs();
			this.initBottomControls();
			this.initLeftTree();
			this.initRightTree();

			if (this.args.isEditMode()) {
				this.loadReportSet();
			}
			Izenda.UI.Widgets.TabsAggregator.tabsList[
				this.name
			].domNode.parentElement.parentElement.children[1].style.display = 'none';

			overrideIzendaAutoJoins();
			function overrideIzendaAutoJoins() {
				window['JTC_TableChanged'] = function (e, callback) {
					if (e) {
						window['ebc_mozillaEvent'] = e;
					}
					var row = window['EBC_GetRow']();

					if (
						row === null ||
						row.parentNode === null ||
						row.parentNode.parentNode === null
					) {
						return;
					}

					var tableId = window['EBC_GetParentTable'](row).id;

					if (row.rowIndex < 0 && row.sectionRowIndex < 0) {
						return;
					}

					if (row.rowIndex > 0 && row.sectionRowIndex > 0) {
						window['JTC_ShowHideParams'](e);
					}

					// update all next Right tables
					var startFrom = 1;
					if (row.sectionRowIndex > 0) {
						startFrom = row.sectionRowIndex;
					}

					var tableSels = document.getElementsByName(tableId + '_Table');
					var columnSels = document.getElementsByName(tableId + '_Column');
					var rightTableSels = document.getElementsByName(
						tableId + '_RightTable'
					);
					var rightColumnSel = document.getElementsByName(
						tableId + '_RightColumn'
					);

					if (
						row.sectionRowIndex > 0 &&
						tableSels[row.sectionRowIndex] !== null
					) {
						if (
							columnSels !== null &&
							columnSels[row.sectionRowIndex] !== null
						) {
							columnSels[row.sectionRowIndex].onchange = null;

							try {
								if (tableSels[row.sectionRowIndex].value == '...') {
									window['EBC_LoadData'](
										'@JTC/Empty',
										null,
										columnSels[row.sectionRowIndex],
										false
									);
								} else {
									window['EBC_LoadData'](
										'CombinedColumnList',
										'tables=' +
											tableSels[row.sectionRowIndex].value +
											'&' +
											'joinFields=true',
										columnSels[row.sectionRowIndex],
										false
									);
								}
							} finally {
								columnSels = document.getElementsByName(tableId + '_Column');
								columnSels[row.sectionRowIndex].onchange =
									window['JTC_LeftColumnChanged'];
							}
						}
					}

					// RightTable possible values
					var tablesWithAliases = window['JTC_GetTableList'](tableId);

					for (var i = startFrom; i < tableSels.length; i++) {
						if (tableSels[i].value != '...') {
							tableSels[i].onchange = null;
							columnSels[i].onchange = null;
							rightTableSels[i].onchange = null;
							rightColumnSel[i].onchange = null;

							try {
								// UpdateRightTable possible values
								window['JTC_SetRightTableSelValues'](
									tableId,
									i,
									tablesWithAliases
								);
								if (callback) {
									callback();
								}
								//JTC_leftAutoJoinQueue[i] = 1;
								// Update Right table and join Fields
								//JTC_SelectRightTableSelValue(tableId, i);
							} finally {
								tableSels = document.getElementsByName(tableId + '_Table');
								columnSels = document.getElementsByName(tableId + '_Column');
								rightTableSels = document.getElementsByName(
									tableId + '_RightTable'
								);
								rightColumnSel = document.getElementsByName(
									tableId + '_RightColumn'
								);
								tableSels[i].onchange = window['JTC_TableChanged'];
								columnSels[i].onchange = window['JTC_LeftColumnChanged'];
								rightTableSels[i].onchange = window['JTC_RightTableChanged'];
								rightColumnSel[i].onchange = window['JTC_RightColumnChanged'];
							}
						}
					}
					window['JTC_CheckAliases'](tableId);
					window['JTC_OnListChanged'](tableId);
				};

				window['JTC_RightTableChanged'] = function (e) {
					if (e) {
						window['ebc_mozillaEvent'] = e;
					}
					var row = window['EBC_GetRow']();
					var tableId = window['EBC_GetParentTable'](row).id;

					var columnSels = window['EBC_GetSelectByName'](row, 'Column');
					var rightTableSels = window['EBC_GetSelectByName'](row, 'RightTable');
					var rightColumnSel = window['EBC_GetSelectByName'](
						row,
						'RightColumn'
					);

					columnSels.onchange = null;
					rightColumnSel.onchange = null;
					rightTableSels.onchange = null;

					try {
						if (row.sectionRowIndex > -1) {
							window['JTC_SetRightColumnValues'](tableId, row.sectionRowIndex);
							rightColumnSel = window['EBC_GetSelectByName'](
								row,
								'RightColumn'
							);
							/*if (rightTableSels.value != "...")
									JTC_AutoJoin(tableId, row["sectionRowIndex"]);*/
						}
					} finally {
						columnSels.onchange = window['JTC_LeftColumnChanged'];
						rightTableSels.onchange = window['JTC_RightTableChanged'];
						rightColumnSel.onchange = window['JTC_RightColumnChanged'];
					}

					window['JTC_CheckAliases'](tableId);
				};
			}
		},
		initBaseItemTypeTree: function () {
			if (this.args.isEditMode() || this.args.itemTypesRightTreeLoaded) {
				// necessary only on postbacks with new report (only preview case?)
				//enable continueToProperties button in edit mode or when manipulation with right tree started
				jq$('#continueToProperties').prop('disabled', false);
				return;
			}
			var baseItemTypeTree = new Izenda.UI.Widgets.BaseItemTypeTree({
				clientUrl: this.args.clientUrl,
				itemTypesList: this.baseItemTypesList,
				onItemTypeClick: this.onItemTypeClick.bind(this)
			});
			baseItemTypeTree.init();
			baseItemTypeTree.placeAt(this.baseItemTypesWidget);
			this.baseItemTypeTree = baseItemTypeTree;
		},
		initSsrSettings: function () {
			function covertToBool(val) {
				return val ? val.toLowerCase() === 'true' : false;
			}

			var tWnd = window.parent;
			if (!tWnd.settingsItem) {
				var settingsItem = aras.newIOMItem('Method', 'GetSSRSetting');
				settingsItem = settingsItem.apply();
				tWnd.settingsItem = settingsItem;
			}

			if (!tWnd.settingsItem.isError()) {
				this.ssrSetting.hideAdvancedForAll = covertToBool(
					tWnd.settingsItem.getProperty('hide_advanced_for_all')
				);
				this.ssrSetting.hideAdvanced = covertToBool(
					tWnd.settingsItem.getProperty('hide_advanced')
				);
				this.ssrSetting.showAll = covertToBool(
					tWnd.settingsItem.getProperty('show_all')
				);
				this.ssrSetting.allowExcludedProperties = covertToBool(
					tWnd.settingsItem.getProperty('allow_excluded_properties')
				);
				this.ssrSetting.excludedProperties = tWnd.settingsItem.getProperty(
					'excluded_properties'
				);
			}
		},
		initItemTypeModesButtons: function () {
			if (!reportItemExists) {
				on(this.itemTypeModes, 'click', this.onItemTypeModesClick.bind(this));
			} else {
				this.itemTypeModes.style.display = 'none';
			}

			if (!this.ssrSetting.showAll) {
				document.getElementById('itm_all').style.display = 'none';
			}
			if (this.ssrSetting.hideAdvancedForAll || this.ssrSetting.hideAdvanced) {
				document.getElementById('itm_advanced').style.display = 'none';
			}
			jq$('#' + this.args.itemTypeMode()).addClass('selected'); // choose current value
		},
		initBreadcrumbs: function () {},
		initBottomControls: function () {
			on(
				this.continueToProperties,
				'click',
				this.args.continueToPropertiesFunc
			);
			Izenda.Utils.improveCheckboxes(
				this.bottomControls,
				'input[type=checkbox]'
			);
			on(this.allowNullsCheckbox, 'change', this.args.allowNullsFunc);
		},
		initLeftTree: function () {
			this.baseItemLeftTree = new Aras.Client.Controls.Experimental.Tree({
				id: 'leftTree',
				IconPath: this.args.clientUrl,
				allowEmptyIcon: true
			});
			this.itemTypeTree.appendChild(this.baseItemLeftTree._tree.domNode);
			on(dijit.byId('leftTree'), 'click', this.leftTreeClickHandler.bind(this));
		},
		initRightTree: function () {
			this.rightTree = new Aras.Client.Controls.Experimental.Tree({
				id: 'rightTree',
				IconPath: this.args.clientUrl,
				allowEmptyIcon: true
			});
			var rightTree = this.rightTree;
			rightTree.contextMenu.add(
				'Delete',
				Izenda.Utils.getI18NText('reportdesigner.right_tree_delete')
			);
			clientControlsFactory.on(this.rightTree, {
				menuInit: function (selectedId) {
					if (
						self.args.isEditMode() &&
						arguments[1].itemTypeId ==
							self.args.djUiSqlBridge.getBaseItemTypeId() &&
						!arguments[1].countSuffix
					) {
						return false;
					}
					return true;
				},
				menuClick: this.rightTreeNodeDeleteCallback.bind(this)
			});
			this.selectedItemsTree.appendChild(this.rightTree._tree.domNode);
			this.args.djUiSqlBridge.rightTreeApplet = this.rightTree;
			on(
				dijit.byId('rightTree'),
				'click',
				this.rightTreeClickHandler.bind(this)
			);

			on(dijit.byId('rightTree'), 'mouseover', function (el) {
				var treeNode = query(el.target).parent('.dijitTreeNode')[0];
				if (treeNode) {
					treeNode.classList.add('dijitTreeNode-hover');
				}
			});
			on(dijit.byId('rightTree'), 'mouseout', function (el) {
				var treeNode = query(el.target).parent('.dijitTreeNode')[0];
				if (treeNode) {
					treeNode.classList.remove('dijitTreeNode-hover');
				}
			});
		},

		rightTreeNodeDeleteCallback: function (commandId, selectedId) {
			var bridge = this.args.djUiSqlBridge;

			var confirmMessage = Izenda.Utils.GetResource(
				'reportdesigner.right_tree_delete_confirmation'
			).Format(
				jq$('#' + selectedId + ' span', bridge.selectionData)[0].textContent
			);
			if (
				this.rightTree._tree.path[this.rightTree._tree.path.length - 1].children
					.length &&
				confirmMessage &&
				!Izenda.Utils.getAras().confirm(confirmMessage)
			) {
				return;
			}
			this.breadcrumbs.innerHTML = Izenda.UI.Widgets.Breadcrumbs.buildBreadcrumbPath(
				this.rightTree._tree.path
			);
			var itemTypeId = bridge.getItemTypeId(bridge.rightSelected);
			var newId = bridge.getRightItemId(bridge.rightSelected);
			selectedId = this.rightTree._tree.selectedItem.id;
			var focusedItemId = this.rightTree._tree.focusedChild
				? this.rightTree._tree.focusedChild.item.id
				: this.rightTree._tree.path[1].id;

			var doParentSelection = searchChild(this.rightTree._tree.selectedItem);

			function searchChild(node) {
				if (node.id == focusedItemId) {
					return true;
				} else if (node.children.length === 0) {
					return false;
				} else {
					for (var i = 0; i < node.children.length; i++) {
						var item = node.children[i];
						if (item.id != focusedItemId) {
							return searchChild(item);
						} else {
							return true;
						}
					}
				}
			}

			if (doParentSelection && this.rightTree._tree.path.length - 2 > 0) {
				itemTypeId = this.rightTree._tree.path[
					this.rightTree._tree.path.length - 2
				].userdata.itemTypeId;
				newId = this.rightTree._tree.path[this.rightTree._tree.path.length - 2]
					.id;
			}
			if (
				!this.deleteFromSelection({
					userdata: {
						guid: selectedId,
						itemTypeId: bridge.getItemTypeId(
							jq$('#' + selectedId, bridge.selectionData)
						)
					}
				})
			) {
				return;
			}
			bridge.moveRightSelectedToParent();
			this.restoreSelectionOnTheLeft(itemTypeId, newId);
			this.rightTree.selectItem(newId);
		},

		onItemTypeModesClick: function (evt) {
			if (
				this.args.djUiSqlBridge.isDirty() &&
				!aras.confirm(
					Izenda.Utils.getI18NText(
						'reportdesigner.message.continue_w_loosing_changes'
					)
				)
			) {
				return;
			}
			if (evt.target.id == 'itm_featured' || evt.target.id == 'itm_all') {
				location.href = location.href.replace(
					'&ITEMTYPEMODE=' + this.args.itemTypeMode(),
					'&ITEMTYPEMODE=' + evt.target.id
				);
			}
		},

		rightTreeClickHandler: function (item, node, evt) {
			///<param name="item">Aras.Client.Controls.Experimental.MainTreeItem</param>
			if (evt.target.className == 'delete-node-btn') {
				if (item.children.length > 0) {
					this.rightTreeNodeDeleteCallback(null, item.id);
				} else {
					this.rightTreeNodeDeleteCallback(null, item.id);
				}
			} else {
				this.restoreSelectionOnTheLeft(
					item.userdata.itemTypeId,
					item.id,
					item.userdata.tabLabel
				);
			}
			this.breadcrumbs.innerHTML = Izenda.UI.Widgets.Breadcrumbs.buildBreadcrumbPath(
				this.rightTree._tree.path
			);
		},

		getBaseItemTypes: function (mode) {
			var tWnd = window.parent;
			if (!tWnd[mode]) {
				var userItemTypes = aras.newIOMItem('Method', 'GetItemTypesForUser');
				userItemTypes.setProperty(
					'request_type',
					mode == 'itm_featured' ? 'featured' : 'all'
				);
				tWnd[mode] = userItemTypes.apply();
			}
			var items;
			var itemIds = [];
			var itemTypes = tWnd[mode];
			if (itemTypes.getResult() !== '') {
				items = itemTypes.getItemsByXPath(aras.XPathResult('/Item'));

				for (var i = 0; i < itemTypes.getItemCount(); i++) {
					var current = itemTypes.getItemByIndex(i);
					itemIds.push(current.getID());
				}
			}
			return items;
		},

		whereClauseFromExcludedProperties: function (id) {
			if (this.ssrSetting.whereClause) {
				return this.ssrSetting.whereClause;
			}

			var whereClause = '';
			if (this.ssrSetting.excludedProperties !== undefined) {
				var excludedProperties = this.ssrSetting.excludedProperties.split('|');
				for (var p = 0; p < excludedProperties.length; p++) {
					var parts = excludedProperties[p].split(':');
					if (parts[0] === id) {
						if (whereClause === '') {
							whereClause = ' where="[PROPERTY].id NOT IN (\'';
						} else {
							whereClause += "','";
						}
						whereClause += parts[1];
					}
				}
				if (whereClause !== '') {
					whereClause += '\')"';
				}
			}

			this.ssrSetting.whereClause = whereClause;
			return whereClause;
		},

		displayLeftTree: function () {
			jq$('#leftTree > .dijitTreeContainer')[0].style.display = 'inline-block';
		},

		onItemTypeClick: function (node) {
			/// <summary>Occures on base item type selection</summary>
			var id = domAttr.get(node, 'data-itemtypeid');
			var whereClause = this.whereClauseFromExcludedProperties(id);
			this.baseItemLeftTree.reload(
				xTemplateHelper.getItemTypeTreeXml(
					id,
					this.args,
					undefined,
					whereClause
				)
			);
			this.baseItemLeftTree.ExpandAll();
			this.displayLeftTree();
			this.baseItemTypesWidget.style.display = 'none';
			this.leftTreeLabel.innerHTML = Izenda.Utils.getI18NText(
				'reportdesigner.selected_base_item_type'
			);
			this.loadRightTree(id);
			jq$('#continueToProperties').prop('disabled', false);
			this.breadcrumbs.innerHTML = node.textContent;
			domStyle.set(this.itemTypeModes, 'display', 'none');
		},

		loadRightTree: function (baseItemTypeId) {
			this.args.djUiSqlBridge.typesDirty = true;
			this.args.djUiSqlBridge.switchDirty();
			if (this.args.djUiSqlBridge.selectionData) {
				this.args.djUiSqlBridge.selectionData.remove();
			}
			this.args.djUiSqlBridge.selectionData = jq$(djUiSqlBridge.treeXmlRoot);
			var rootItem = new this.args.djMainTreeItem();
			rootItem.userdata = {
				itemTypeId: baseItemTypeId,
				nodeType: NodeType.Root
			};
			this.addItemTypeToSelectionCurrentNode(rootItem);
			this.args.djUiSqlBridge.setRoot();
			// add 1st table to 1st Izenda UI <select> & press "add below" btn
			var tableIndex = 0;
			var tableName = this.args.djUiSqlBridge.getTableNameForIzenda(
				baseItemTypeId
			);
			this.args.djUiSqlBridge.setFirstTableSelect(tableIndex, tableName);
		},

		addItemTypeToSelectionCurrentNode: function (item) {
			/// <summary>On checking in left tree, adds selected to right tree under its current selection</summary>
			/// <param name="item">MainTreeItem</param>

			item = item || baseItemLeftTree.selectedItem;
			if (!item.userdata.itemTypeId) {
				// click on, e.g., Relationships node
				return;
			}

			var template = jq$('#rightDataNode').html();

			item.userdata.guid = item.userdata.guid || aras.GUIDManager.GetGUID();

			var itemType = getItemType(item.userdata.itemTypeId);
			var largeIcon = '';
			var nodeType = parseInt(item.userdata.nodeType);

			switch (nodeType) {
				case NodeType.Relationship:
					largeIcon =
						'/modules/aras.innovator.Izenda/images/RelationshipType.svg';
					break;
				case NodeType.ItemProperty:
				case NodeType.ListProperty:
					largeIcon = '/modules/aras.innovator.Izenda/images/ItemProperty.svg';
					break;
				case NodeType.Root:
					largeIcon = '/images/ItemType.svg';
					break;
			}

			var name =
				item.userdata.tabLabel ||
				getItemTypeLabel(getItemType(item.userdata.itemTypeId));
			if (
				nodeType === NodeType.ItemProperty ||
				nodeType === NodeType.ParentItemProperty ||
				nodeType === NodeType.ListProperty
			) {
				name = item.userdata.propName + ' (' + name + ')';
			}

			var itemTypesCountSuffix = this.args.djUiSqlBridge.getItemTypesCountSuffix(
				item.userdata.itemTypeId
			);
			var isRelationship = nodeType == NodeType.Relationship;
			var firstToAdd = format(
				template,
				item.userdata.guid,
				item.userdata.itemTypeId,
				nodeType /*enum same*/,
				item.userdata.columnName,
				name + itemTypesCountSuffix,
				largeIcon,
				itemTypesCountSuffix,
				item.userdata.tabLabel,
				name,
				isRelationship
			);

			var addingSecond =
				(isRelationship || nodeType === NodeType.ParentRelationship) &&
				item.userdata.relatedItemTypeId;
			if (addingSecond) {
				firstToAdd = jq$(firstToAdd);
				item.userdata.relatedGuid =
					item.userdata.relatedGuid || aras.GUIDManager.GetGUID();

				var largeIconSecond = '/images/ItemType.svg';
				var nameOfRelated = getItemTypeLabel(
					getItemType(item.userdata.relatedItemTypeId)
				);
				itemTypesCountSuffix = this.args.djUiSqlBridge.getItemTypesCountSuffix(
					item.userdata.relatedItemTypeId
				);
				var secondToAdd = format(
					template,
					item.userdata.relatedGuid,
					item.userdata.relatedItemTypeId,
					isRelationship
						? JoinRule.RelationshipTarget
						: JoinRule.ParentRelationshipTarget,
					item.userdata.columnName,
					nameOfRelated + itemTypesCountSuffix,
					largeIconSecond,
					itemTypesCountSuffix,
					'',
					nameOfRelated
				);

				firstToAdd.append(secondToAdd);
			}

			(
				this.args.djUiSqlBridge.rightSelected ||
				this.args.djUiSqlBridge.selectionData
			).append(firstToAdd);
			this.args.djUiSqlBridge.rewriteItemTypesCountSuffix(
				item.userdata.itemTypeId
			);
			if (addingSecond) {
				this.args.djUiSqlBridge.rewriteItemTypesCountSuffix(
					item.userdata.relatedItemTypeId
				);
			}
			this.reloadSelectionRightTree();
			this.args.djUiSqlBridge.typesDirty = true;
			this.args.djUiSqlBridge.switchDirty();
		},

		leftTreeClickHandler: function (item, node, evt) {
			var tgt = jq$(jq$.event.fix(evt).target);

			var iconEl = jq$('.dijitTreeIcon', node.domNode).first();
			var icon = iconEl.css('background-image');
			var isChecked = icon.indexOf('-checked.svg') > -1;

			if (isChecked) {
				var firstLevel = tgt.hasClass('relationship_href');
				if (firstLevel || tgt.hasClass('related_href')) {
					var guid = firstLevel
						? item.userdata.guid
						: item.userdata.relatedGuid;
					this.rightTree.selectItem(guid);
					this.restoreSelectionOnTheLeft(tgt.data('itemtypeid'), guid);
					return;
				}
			}

			if (isChecked) {
				this.deleteFromSelection(item, true);
			} else {
				this.addItemTypeToSelectionCurrentNode(item);
			}
			iconEl.css(
				'background-image',
				isChecked
					? icon.replaceAll('-checked.svg', '-unchecked.svg')
					: icon.replaceAll('-unchecked.svg', '-checked.svg')
			);
		},

		loadReportSet: function () {
			/// <summary>imperfect place, func is not tab specific, but Item Tab is 1 1st tab</summary>
			this.args.djUiSqlBridge.selectionData = jq$(djUiSqlBridge.treeXmlRoot);
			if (clientReportSetData) {
				this.args.djUiSqlBridge.selectionData.html(
					unescape(clientReportSetData.SelectedItemTypes)
				);
			}
			this.args.djUiSqlBridge.setRoot();
			this.reloadSelectionRightTree();

			if (clientReportSetData) {
				document.getElementById('item_type_mode').value =
					clientReportSetData.ItemTypeMode;
			}

			var joinedTables = reportSet.JoinedTables;
			for (var i = 1; i < joinedTables.length; i++) {
				if (
					joinedTables[i].LeftConditionColumn !=
						'[innovator].[VALUE].[VALUE]' &&
					joinedTables[i].JoinType == 'LEFT_OUTER'
				) {
					Izenda.Utils.setCheckboxState(this.allowNullsCheckbox, true);
					break;
				}
			}

			// IR-038490/1 addition: autoselect when report is loaded for editing
			var rightTreeItems = this.rightTree._model._items;
			if (rightTreeItems && rightTreeItems[1]) {
				this.rightTree.selectItem(rightTreeItems[1].id);
				this.rightTreeClickHandler(rightTreeItems[1], null, {
					target: {}
				});
			}
		},

		reloadSelectionRightTree: function () {
			this.rightTree.reload(this.args.djUiSqlBridge.htmlToTree());
			this.rightTree._tree.expandAll().then(
				function () {
					if (self.args.isEditMode()) {
						domStyle.set(
							query('.dijitTreeRow p', this.rightTree.domNode)[0],
							'display',
							'none'
						);
					}
				}.bind(this)
			);
		},

		deleteFromSelection: function (item, fromLeftTree) {
			/// <summary>Can't be invoked on root (on base item type)</summary>
			/// <param name="item">MainTreeItem from left tree or synthetical item from right tree</param>
			var itemGuid = item.userdata.guid;
			var itemTypeId = item.userdata.itemTypeId;
			if (
				itemTypeId == this.args.djUiSqlBridge.getBaseItemTypeId() &&
				this.rightTree._tree.path.length == 2 &&
				!fromLeftTree
			) {
				if (!this.args.isEditMode()) {
					location.href = location.href; // location.reload() gives browser postback confirmation dlg
					return false;
				} else {
					aras.AlertError(
						Izenda.Utils.getI18NText(
							'reportdesigner.validation.cant_change_base_item_type'
						)
					);
				}
				return true;
			}
			var beingUnchecked = jq$(
				'#' + itemGuid,
				this.args.djUiSqlBridge.selectionData
			);
			beingUnchecked.remove();

			var self = this;
			this.args.djUiSqlBridge
				.getAllUsedItemTypeIds()
				.forEach(function (_itemTypeId) {
					self.args.djUiSqlBridge.rewriteItemTypesCountSuffix(
						_itemTypeId,
						getItemTypeLabel(getItemType(_itemTypeId))
					);
				});
			this.reloadSelectionRightTree();

			this.args.djUiSqlBridge.typesDirty = true;
			this.args.djUiSqlBridge.switchDirty();
			return true;
		},

		restoreSelectionOnTheLeft: function (
			itemTypeId,
			rightItemId,
			itemTypeLabel
		) {
			if (!itemTypeId || !rightItemId) {
				return;
			}
			///<param name="itemTypeId"></param>
			///<param name="rightItemId">HTML node id</param>
			var whereClause = this.whereClauseFromExcludedProperties(itemTypeId);
			var xml = xTemplateHelper.getItemTypeTreeXml(
				itemTypeId,
				this.args,
				itemTypeLabel,
				whereClause
			);
			this.args.djUiSqlBridge.rightSelected = jq$(
				'#' + rightItemId,
				this.args.djUiSqlBridge.selectionData
			); // before restoreSelection()
			xml = this.args.djUiSqlBridge.restoreSelection(itemTypeId, xml);
			//showItemTypeTree(this.baseItemLeftTree, xml);
			this.baseItemLeftTree.reload(xml);
			this.baseItemLeftTree.ExpandAll();
			var el = jq$('#itemTypeTree');
			if (el.css('display').toLowerCase() == 'none') {
				jq$('#baseItemTypes').hide();
				document.getElementById('search').style.display = 'none';
				document.querySelector('#itemTypesNProps .half_label').textContent =
					'Search Related';
				el.show();
			}
			this.displayLeftTree();
		}
	});

	dojo.setObject('Izenda.UI.Tab.ItemTypes', ItemTypesTab);
});
