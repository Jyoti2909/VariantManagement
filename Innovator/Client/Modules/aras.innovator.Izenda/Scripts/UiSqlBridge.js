// contains current Izenda version-specific CSS selectors; jQuery, Utils & ReportDesigner dependent
// all selection right tree string constants & operations should be here
// Considering XML/HTML tree data, remember tr/div, attr()/data() etc. replacements
define(['dojo/_base/declare'], function (declare) {
	var self;
	return declare('Aras.Client.Izenda.UiSqlBridge', null, {
		joinsContainerId: 'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_jtc',
		containerId: 'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01',
		treeXmlRoot:
			'<table enablehtml="false" icon0="" icon1="" treelines="1" thinborder="true" id="selectionData"></table>',
		selectionData: null, // right tree XMLstring-created jq that points to <table>; can be XmlDocument when removing jq
		rightSelected: null, // jQuery selectionData tr(div) pointer (current node selected)

		rowsToAdd: {}, // container for rows need to add to Properties tab when item selected in ItemTypes

		// true if cooresponding tab changes NOT applied to Izenda UI
		typesDirty: false,
		propsDirty: false,
		allowNullsDirty: false,

		dirty: false, // changes not saved to DB; affects Innovator actions availability

		allowDiscardChanges: false, //allow to close window without asking to save

		constructor: function (args) {
			this.args = args;
			if (args.containerId) {
				this.joinsContainerId = args.containerId + '_jtc';
				this.containerId = args.containerId;
			}
			self = this;
		},

		isDirty: function () {
			return this.dirty || this.typesDirty || this.propsDirty;
		},

		getReportName: function () {
			return document.getElementById('innovatorReportName').value;
		},

		getItemTypeId: function (node, secondary) {
			/// <param name="secondary">itemTypeId2 is missing and unused because of parent usage</param>
			return this.getItemTypeUserData(
				node,
				format('itemTypeId{0}', secondary ? '2' : '')
			);
		},

		getItemTypeUserData: function (node, key) {
			/// <summary>Gets from right tree XML</summary>
			if (typeof node.children !== 'function') {
				node = jq$(node);
			}
			return node.children(format('label[data-key="{0}"]', key)).data('value');
		},

		switchDirty: function () {
			var value = this.isDirty();
			var toolbar = window.parent.tearOffMenuController.toolbar;
			toolbar.getItem('save').SetEnabled(value);
			toolbar.getItem('save_unlock_close').SetEnabled(value);
			window.toolbar.enableSaveAsButton(!value);
		},

		setDirty: function () {
			self.dirty = true;
			self.switchDirty();
		},

		cleanDirty: function () {
			self.dirty = false;
			self.switchDirty();
		},

		getJoins: function (joins, parent) {
			/// <summary></summary>
			/// <param name="joins" type="Array">Array of Arrays</param>
			/// <param name="parent" type="HTMLElement"></param>
			/// <returns type="Array">Array of Arrays</returns>
			joins = joins || [];
			var self = this;
			for (var i = 0; i < parent.childNodes.length; ++i) {
				if (parent.childNodes[i].nodeName !== 'DIV') {
					continue;
				}
				var parentRule = self.getItemTypeUserData(parent, 'rule');

				var node = jq$(parent.childNodes[i]);
				var itemTypeId = self.getItemTypeId(node);
				var itemType = self.getTableNameOnly(itemTypeId);
				var tableName = self.getTableNameForIzenda(itemTypeId);
				var alias = itemType + '_' + self.getRightItemId(node);
				var rule = self.getItemTypeUserData(node, 'rule');
				var columnName = self.getItemTypeUserData(node, 'columnName');
				var tableName2;
				var suffix2;
				var columnSuffix2 = '';
				if (rule != JoinRule.Root) {
					var parentItemTypeId = self.getItemTypeId(parent);
					if (parentRule != JoinRule.Root) {
						suffix2 = self.getTableNameOnly(parentItemTypeId) + '_' + parent.id; // right table alias
					}
					columnSuffix2 = suffix2 ? "'" + suffix2 : '';
					suffix2 = suffix2 ? '*' + suffix2 : '';
					tableName2 = self.getTableNameForIzenda(parentItemTypeId);
				}

				var data = [];
				var leftColumn;
				var rightColumn;
				var izendaAllowNullsCheckbox = djQuery('input[name="AllowNulls"]')[0];
				var joinType =
					izendaAllowNullsCheckbox !== undefined &&
					izendaAllowNullsCheckbox.checked
						? 'LEFT_OUTER'
						: 'INNER';
				switch (rule) {
					case JoinRule.Root:
						break;
					case JoinRule.Relationship:
						leftColumn = format('{0}.[SOURCE_ID]', tableName);
						rightColumn = format('{0}.[ID]{1}', tableName2, columnSuffix2);
						break;
					case JoinRule.RelationshipTarget:
						leftColumn = format('{0}.[ID]', tableName);
						rightColumn = format(
							'{0}.[RELATED_ID]{1}',
							tableName2,
							columnSuffix2
						);
						break;
					case JoinRule.ParentRelationship:
						leftColumn = format('{0}.[RELATED_ID]', tableName);
						rightColumn = format('{0}.[ID]{1}', tableName2, columnSuffix2);
						break;
					case JoinRule.ParentRelationshipTarget:
						leftColumn = format('{0}.[ID]', tableName);
						rightColumn = format(
							'{0}.[SOURCE_ID]{1}',
							tableName2,
							columnSuffix2
						);
						break;
					case JoinRule.ItemProperty:
						leftColumn = format('{0}.[ID]', tableName);
						rightColumn = format(
							'{0}.[{1}]{2}',
							tableName2,
							columnName.toUpperCase(),
							columnSuffix2
						);
						break;
					case JoinRule.ParentItemProperty:
						leftColumn = format(
							'{0}.[{1}]',
							tableName,
							columnName.toUpperCase()
						);
						rightColumn = format('{0}.[ID]{1}', tableName2, columnSuffix2);
						break;
					case JoinRule.ListProperty:
						leftColumn = format('{0}.[VALUE]', tableName);
						rightColumn = format(
							'{0}.[{1}]{2}',
							tableName2,
							columnName.toUpperCase(),
							columnSuffix2
						);
						joinType = 'LEFT_OUTER';
						break;
					default:
						throw 'Not implemented';
				}

				data.push(tableName);

				if (rule !== JoinRule.Root) {
					tableName2 = tableName2 + suffix2;
					data.push(leftColumn);
					data.push(tableName2);
					data.push(rightColumn);
					data.push(joinType);
					data.push(alias);
				}

				joins.push(data);
				self.getJoins(joins, parent.childNodes[i]);
			} // for
			return joins;
		},

		getTableNameOnly: function (itemTypeId) {
			return this.args.arasObj
				.getItemTypeForClient(itemTypeId, 'id')
				.getProperty('instance_data');
		},

		getTableNameForIzenda: function (itemTypeId) {
			return format('[innovator].[{0}]', this.getTableNameOnly(itemTypeId));
		},

		fix2ndTableInJoins: function () {
			if (!reportItemExists) {
				return;
			}
			//most probably not need for guid based aliases anymore, but left for backward compatibility
			var self = this;
			jq$(format('#{0} tr', this.joinsContainerId)).each(function (ind, elem) {
				if (ind < 1) {
					return;
				}
				ind--;
				var jq = jq$('select:eq(2)', elem);
				if (jq.val() == '...' && reportSet.JoinedTables[ind]) {
					var jtDef = reportSet.JoinedTables[ind];
					var parts = jtDef.RightConditionTable.split('.');
					var tableName = parts[parts.length - 1]
						.replace('[', '')
						.replace(']', '');
					var re = new RegExp(tableName + '\\d+');
					if (re.test(jtDef.RightAlias)) {
						var innerCallback = function (ind, jtDef) {
							self.setSelectValue(ind, 1, jtDef.LeftConditionColumn);
							self.setSelectValue(
								ind,
								3,
								jtDef.RightConditionColumn + "'" + jtDef.RightAlias
							);
						}.bind(self, i, jtDef);
						self.setSelectValue(
							ind,
							2,
							jtDef.RightConditionTable +
								'*' +
								jtDef.RightAlias.substr(tableName.length),
							innerCallback
						); // tmp test
					}
				}
			});
		},

		setSelectValue: function (trIndex, selectIndex, value, callback, alias) {
			/// <summary>Modifies Izenda UI</summary>
			/// <param name="trIndex" type="int">0-based SELECTs data row</param>
			try {
				var jq = jq$(
					format(
						'#{0} tr:eq({1}) select:eq({2})',
						this.joinsContainerId,
						trIndex + 1,
						selectIndex
					)
				); // zero index TR is with labels
				jq[0].value = value; // sometimes jq.val(value) fails!
				if (jq.val() != value) {
					for (var i = 0; i < jq[0].length; i++) {
						if (jq[0][i].value.toLowerCase() === value.toLowerCase()) {
							jq[0].value = jq[0][i].value;
							break;
						}
					}
				}

				// set alias into join to identify exact table
				if (alias) {
					var jq2 = jq$(
						format(
							'#{0} tr:eq({1}) input:[name={2}]',
							this.joinsContainerId,
							trIndex + 1,
							this.joinsContainerId + '_OldTableAlias'
						)
					);
					var jq3 = jq$(
						format(
							'#{0} tr:eq({1}) input:[name={2}]',
							this.joinsContainerId,
							trIndex + 1,
							this.joinsContainerId + '_TableAlias'
						)
					);
					jq2[0].setAttribute('value', alias);
					jq3[0].setAttribute('value', alias);
					jq3[0].onchange();
				}

				switch (selectIndex) {
					case 0:
						window['JTC_TableChanged'](jq[0], callback);
						break;
					case 1:
						window['JTC_LeftColumnChanged'](jq[0]);
						break;
					case 2:
						window['JTC_RightTableChanged'](jq[0]);
						break;
					case 3:
						window['JTC_RightColumnChanged'](jq[0]);
						break;
					case 4:
						break;
					default:
						throw 'Not implemented';
				}
			} catch (e) {
				throw e;
			}
		},

		insertJoinBelow: function (tableIndex) {
			var jq = jq$(
				format('#{0} tr:eq({1}) img', this.joinsContainerId, tableIndex + 1)
			);
			var jq2 = jq.last(); // "Add new datasource" button
			jq2.trigger('click'); // Emulate click on this button
		},

		validateReport: function () {
			/// <summary>Returns null either error message string</summary>
			if (this.typesDirty) {
				return Izenda.Utils.getI18NText(
					'reportdesigner.validation.apply_types_to_izenda'
				);
			}
			/*if (this.propsDirty) { // unnecessary now, props are autoapplied
				return Izenda.Utils.getI18NText("reportdesigner.validation.apply_props_to_izenda");
			}*/

			if (this.getReportName().trim().length === 0) {
				return Izenda.Utils.getI18NText('reportdesigner.validation.empty_name');
			}

			var selects = document.querySelectorAll(
				'#' + this.containerId + '_sc_Column'
			);
			for (var i = 0; i < selects.length; ++i) {
				if (selects[i].value !== '...') {
					return null;
				}
			}
			return Izenda.Utils.getI18NText(
				'reportdesigner.validation.no_properties_selected'
			);
		},

		setFirstTableSelect: function (tableIndex, tableName) {
			//avoid alias for main table as Izenda ignore it
			this.setSelectValue(tableIndex, 0, tableName);
		},

		applyJoins: function (callback) {
			// evaluate changes before cleaning/adding rows
			let joinRows = jq$(format('#{0} tr', this.joinsContainerId));
			let jrLength = joinRows.length;
			const joins = this.getJoins(null, this.selectionData[0]);
			const joinsToAdd = [];
			// skip main table
			for (let j = 1; j < joins.length; j++) {
				let at = true;
				// skip label and main table row
				for (let i = 2; i < joinRows.length; i++) {
					const jrData = jq$(joinRows[i]).find('select');
					const jrAlias = jq$(joinRows[i]).find('input:[name*=TableAlias]')[0]
						.value;
					if (
						joins[j][1].toUpperCase() === jrData[1].value.toUpperCase() &&
						joins[j][3].toUpperCase() === jrData[3].value.toUpperCase() &&
						joins[j][5].toUpperCase() === jrAlias.toUpperCase()
					) {
						at = false;
						if (
							this.allowNullsDirty &&
							joins[j][4].toUpperCase() !== jrData[4].value.toUpperCase()
						) {
							// udpate join type only
							jrData[4].value = joins[j][4];
						}
						joinRows.splice(i, 1);
						break;
					}
				}
				if (at) {
					joinsToAdd.push(joins[j]);
				}
			}
			jrLength = jrLength - joinRows.length;

			// remove only neccessary rows, except label and main table row (2 first rows)
			// remove prev. joins; if down->up no XHRs; remember th tr
			// look for remove row button inside row object to push
			const rribSel = 'img[name=' + this.joinsContainerId + '_RemoveBtn]';
			for (let i = joinRows.length - 1; i > 1; i--) {
				const removeRowImgBtn = jq$(joinRows[i]).find(rribSel)[0];
				window['JTC_RemoveHandler'](removeRowImgBtn); // no XHRs here
			}

			function finishing(dontResetCallBack) {
				if (!dontResetCallBack) {
				}
				this.typesDirty = false;
				this.allowNullsDirty = false;
				if (callback && typeof callback === 'function') {
					callback();
				}
			}

			if (joins.length === 1) {
				finishing.call(this, true);
				return; // only 1 table is selected
			}

			var self = this;
			// define order of join condition filling
			var joinSelectIndices = [0, 2, 1, 3, 4];

			globalJoinsLengthCounter = joins.length;

			// build join line
			let innerCallback = function (ja, jrl) {
				for (let j = 1; j < joinSelectIndices.length; j++) {
					const ind = joinSelectIndices[j];
					self.setSelectValue(jrl, ind, joinsToAdd[ja][ind]);
				}
			};

			// initiate build new join lines
			// when adding/removing rows try to keep order
			// todo: test case with hierarchies and outer joins
			for (let ja = 0; ja < joinsToAdd.length; ja++) {
				self.insertJoinBelow(jrLength);
				jrLength++;
				this.rowsToAdd[jrLength] = joinsToAdd[ja];
				this.setSelectValue(
					jrLength,
					0,
					joinsToAdd[ja][0],
					innerCallback.bind(this, ja, jrLength),
					joinsToAdd[ja][5]
				);
			}

			finishing.call(self);
		},

		htmlToTree: function () {
			/// <summary>Converts HTML/jQuery compatible markup to Aras Tree markup</summary>
			return (
				this.selectionData[0].outerHTML // todo: why not this.selectionData.html()?
					.replaceAll('<div', '<tr')
					.replaceAll('</div>', '</tr>')
					.replace(/<span\>(.*?)<\/span\>/gim, '<td>$1</td>')
					/*.replaceAll("<span>", "<td>")
              .replaceAll("</span>", "</td>")*/
					.replaceAll('<label', '<userdata')
					.replaceAll('</label>', '</userdata>')
					.replaceAll('data-key', 'key')
					.replaceAll('data-value', 'value')
			);
		},

		restoreSelection: function (itemTypeId, xml) {
			/// <summary>Restore checkbox selection in XML for left tree from rightSelected children</summary>
			/// <param name="xml">Aras Tree table-tr-td ItemType XML for base ItemType left tree</param>
			/// <returns>XML updated with checked icons</returns>
			var doc = this.args.arasObj.createXMLDocument();
			doc.loadXML(xml);
			var typeSafeName = this.getTableNameOnly(itemTypeId);
			var checkedIconUrl = '/images/checkbox-checked.svg';
			var self = this;
			this.rightSelected.children().each(function (ind, _child) {
				var child = jq$(_child);
				if (child[0].nodeName.toLowerCase() !== 'div') {
					return;
				}
				var rule = self.getItemTypeUserData(child, 'rule');
				var itemTypeId = self.getItemTypeUserData(child, 'itemTypeId');
				var node;
				var childItemType = self.getTableNameOnly(itemTypeId);
				var itemPropertyXPath = '//tr[@id="{0}/ItemTypes/{1}"]';
				var columnName = self.getItemTypeUserData(child, 'columnName');
				switch (rule) {
					case JoinRule.Relationship:
					case JoinRule.ParentRelationship:
						node = doc.selectSingleNode(
							format(
								'//tr[@id="{0}/Relationships/{1}"]',
								typeSafeName,
								childItemType
							)
						);
						break;
					case JoinRule.ItemProperty:
					case JoinRule.ListProperty:
						node = doc.selectSingleNode(
							format(itemPropertyXPath, typeSafeName, columnName)
						);
						break;
					case JoinRule.ParentItemProperty:
						node = doc.selectSingleNode(
							format(itemPropertyXPath, childItemType, columnName)
						);
						break;
				}

				if (node) {
					node
						.selectSingleNode('userdata[@key="guid"]')
						.setAttribute('value', _child.id);
					node.setAttribute('icon0', checkedIconUrl);
					node.setAttribute('icon1', checkedIconUrl);
				}
			});
			return doc.xml;
		},

		getBaseItemTypeId: function () {
			return this.getItemTypeId(this.getRightRoot());
		},

		getRightRoot: function () {
			return jq$('div', this.selectionData);
		},

		getRightItemId: function (node) {
			///<param name="node">jQuery element</param>
			return node.attr('id');
		},

		setRoot: function () {
			this.rightSelected = this.getRightRoot();
		},

		getItemTypesCountSuffixSelector: function (itemTypeId) {
			///<summary>// all labels for tree nodes of given item type id</summary>
			return jq$(
				format('label[data-key="itemTypeId"][data-value="{0}"]', itemTypeId),
				this.selectionData
			);
		},

		getItemTypesCountSuffix: function (itemTypeId) {
			var cnt = this.getItemTypesCountSuffixSelector(itemTypeId).length;
			return cnt > 0 ? cnt + 1 : '';
		},

		rewriteItemTypesCountSuffix: function (itemTypeId) {
			var jq = this.getItemTypesCountSuffixSelector(itemTypeId);
			jq.each(function (ind, _elem) {
				var label = jq$(_elem);
				var treeNode = label.parent();

				var span = treeNode.children('span').first();
				var name = treeNode
					.children("label[data-key='caption']")
					.first()
					.data('value');
				// name might contains brackets which are special symbols in RegExp
				// potentialy wrong behavior if tree is build with another pattern initially
				var re = new RegExp(
					'\\b' + name.replace('(', '\\(').replace(')', '\\)') + '\\d*\\b',
					'i'
				);
				var suffix = ind > 0 ? ind + 1 : '';
				span.html(span.html().replace(re, name + suffix));

				// don't use jq$.data() for changing values created via template - at least IE11 problem for curr. Izenda jQuery 1.7.x
				var countSuffix = treeNode
					.children("label[data-key='countSuffix']")
					.first();
				countSuffix.attr('data-value', suffix);
			});
		},

		getAllUsedItemTypeIds: function () {
			var ids = [];
			jq$("label[data-key='itemTypeId']", this.selectionData).each(function (
				index,
				dataTag
			) {
				ids.push(jq$(dataTag).data('value'));
			});
			return ids;
		},

		moveRightSelectedToParent: function () {
			var parent = this.rightSelected.parent();
			this.rightSelected =
				parent && parent.attr('id') !== 'selectionData'
					? parent
					: this.rightSelected;
		},

		getSelectedItemTypeProps: function () {
			/// <returns>All right tree nodes that were selected as props of data type = &quot;item&quot;</returns>
			/// only those with data-value=1 and data-value=4 need to add as preselectedProperties, but getting all items need to keep context
			return jq$('label[data-key="rule"][data-value]', this.selectionData);
		},

		getReportExtension: function () {
			var itemTypeMode = clientReportSetData
				? clientReportSetData.ItemTypeMode
				: '';
			var selectedItemTypes = this.selectionData
				? this.selectionData.html()
				: '';
			var metaData = decodeURIComponent(
				Izenda.UI.Widgets.TabsAggregator.getMetaData()
			);

			return Izenda.Utils.createReportExtension(
				itemTypeMode || 'itm_featured',
				selectedItemTypes,
				metaData
			);
		}
	});
});
