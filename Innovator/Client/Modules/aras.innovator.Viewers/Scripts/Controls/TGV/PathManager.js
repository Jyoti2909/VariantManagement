define(['dojo/_base/declare'], function (declare) {
	return declare('PathManager', [], {
		_pathsDelimiter: '/',

		_mainPage: null,

		_onNotFoundItemCallback: null,

		_specialRowRefId: null,

		_pathsStr: null,

		isShowMoreLoadingInProgress: null,

		constructor: function () {},

		setMainPage: function (mainPage) {
			this._mainPage = mainPage;
		},

		setOnNotFoundItemCallback: function (callback) {
			this._onNotFoundItemCallback = callback;
		},

		getPathsOfSelectedNode: function () {
			let selectedGridRowId = this._mainPage._grid._grid.settings
				.selectedRows[0];
			if (!selectedGridRowId && selectedGridRowId !== 0) {
				return;
			}
			let paths = [];
			this._fillPathsRecursively(selectedGridRowId, paths);
			let pathsStr = paths.join(this._pathsDelimiter);
			return pathsStr;
		},

		_fillPathsRecursively: function (gridRowId, paths) {
			let row = this._mainPage._grid._grid.rows.get(gridRowId);
			this._fillPathsByGridRowId(gridRowId, paths);
			if (row.parentKey || row.parentKey === 0) {
				this._fillPathsRecursively(row.parentKey, paths);
			}
		},

		_fillPathsByGridRowId: function (gridRowId, paths) {
			var sortedData = this._getSortedData(gridRowId);
			sortedData.map(
				function (item) {
					paths.unshift(this._getPathFromDataItem(item));
				}.bind(this)
			);
		},

		_getPathFromDataItem: function (dataItem) {
			return dataItem.queryItemRefId + ':' + dataItem.itemId;
		},

		_getSortedData: function (gridRowId) {
			let rowContextData = this._mainPage._grid.getRow(gridRowId).rcData;
			let data = [];
			if (rowContextData) {
				//for 'Show More' row rowContextData is undefined
				for (let key in rowContextData.Entries) {
					if (!rowContextData.Entries.hasOwnProperty(key)) {
						continue;
					}
					data.push({
						queryItemRefId: key,
						itemId: rowContextData.Entries[key].Id
					});
				}
			}

			var sortedData = this._sortDataForCombinedRows(data);
			//TODO (general TGVDs): fix for use-case in email 'TGV 3d Viewer PathManager (getSelectedNodePath, selectByPath), reason to use metadata of QD'
			return sortedData;
		},

		_sortDataForCombinedRows: function (data) {
			//TODO (general TGVDs): implement based on metadata
			//queryItemRefIds in data in a combined row can be in any order. So, we need to sort them according to the QueryDefinition not to break
			//parent-child order.
			//can be implemented easy if to have 'QueryDefinition' object with functions parent(), children() and 'level' property for each node.
			//now is temp implementation just to make it working for TGVDs in test package.
			return data.reverse();
		},

		selectByPaths: function (pathsStr) {
			//TODO rewrite to use Promises. It can be a bad practice to use callbacks (_onNotFoundItemCallback) and promises at the same time
			//TODO (general TGVDs): fix for complex use-cases with Combined rows: for cases if in combined row there are not all items, different 'mapped' rows,
			//'special row'.
			//test/fix for re-use.
			const self = this;
			if (this._mainPage.cancelClick) {
				this._pathsStr = pathsStr;
				this._mainPage.cancelClick();
				return;
			}
			if (!this._onNotFoundItemCallback) {
				alert(
					'call function setOnNotFoundItemCallback before using this function'
				); //the message is for developers only, no need to localize it.
			}

			const paths = pathsStr.split(this._pathsDelimiter);

			if (this._mainPage._grid._grid.roots.length === 0) {
				this._mainPage
					._fillTree()
					.then(function (result) {
						if (
							!result ||
							result.isCancelClicked ||
							self._mainPage._grid._grid.roots.length === 0
						) {
							return;
						}
						self.selectByPaths(pathsStr);
					})
					.catch(function (ex) {
						aras.AlertError(ex.message);
					});
				return;
			}

			this._compareAndExpandArray(paths, this._mainPage._grid._grid.roots);
		},

		overrideTreeGridForCancelClick: function () {
			const toggleExpanded = this._mainPage._grid._grid.actions._toggleExpanded;
			const self = this;
			this._mainPage._grid._grid.actions._toggleExpanded = function () {
				return toggleExpanded.apply(this, arguments).then(function (value) {
					if (self._callSelectByPathIfRequired()) {
						return { isCancelledSelectByPath: true };
					}

					return value;
				});
			};
		},

		_callSelectByPathIfRequired: function () {
			if (this._pathsStr) {
				this.selectByPaths(this._pathsStr);
				this._pathsStr = null;
				return true;
			}
		},

		_compareAndExpandArray: function (paths, gridRowIds) {
			if (!gridRowIds || !gridRowIds.length) {
				return;
			}
			const pathsLengthBefore = paths.length;
			const showMoreObj = {
				isClicked: null
			};
			for (let i = 0; i < gridRowIds.length; i++) {
				let gridRowId = gridRowIds[i];
				const parentGridRowId = this._mainPage._grid._grid.rows.get(gridRowId)
					.parentKey;
				if (
					this._compareAndExpand(gridRowId, parentGridRowId, paths, showMoreObj)
				) {
					break;
				}
			}
			if (
				!showMoreObj.isClicked &&
				pathsLengthBefore &&
				pathsLengthBefore === paths.length
			) {
				this._onNotFoundItemCallback();
			}
		},

		_compareAndExpand: function (
			gridRowId,
			parentGridRowId,
			paths,
			showMoreObj
		) {
			var sortedData = this._getSortedData(gridRowId); //eliminate usage of getSortedData here after fixing
			//TODO (general TGVDs): fix for use-case in email 'TGV 3d Viewer PathManager (getSelectedNodePath, selectByPath), reason to use metadata of QD'
			//because the fix will work only getPath.
			if (sortedData.length === 0) {
				//handle for a case if ShowMore need to click
				showMoreObj.isClicked = true;
				this._mainPage._grid._grid.settings.selectedRows = [gridRowId];
				this.isShowMoreLoadingInProgress = true;
				const promise = this._mainPage._onLinkClick(
					this._mainPage._grid.showMoreLinkValue
				);
				promise
					.then(
						function (result) {
							this.isShowMoreLoadingInProgress = false;
							if (!result || result.isCancelClicked) {
								return result;
							}
							if (!parentGridRowId && parentGridRowId !== 0) {
								this.selectByPaths(paths.join(this._pathsDelimiter));
								return;
							}
							this._mainPage._grid._grid.settings.selectedRows = [
								parentGridRowId
							];
							this._expandRecursivelyByPaths(paths);
							return result;
						}.bind(this)
					)
					.catch(function (ex) {
						aras.AlertError(ex.message);
					});
				return false;
			}
			if (this._compareAndModifyPaths(sortedData, paths)) {
				this._mainPage._grid.setSelectedFocusedAndScrollToRow(gridRowId);
				if (paths.length) {
					this._mainPage._grid._grid
						.expand(gridRowId)
						.then(
							function (result) {
								if (result && result.isCancelledSelectByPath) {
									return;
								}

								this._expandRecursivelyByPaths(paths);
							}.bind(this)
						)
						.catch(function (ex) {
							aras.AlertError(ex.message);
						});
				}

				return true;
			}
		},

		_compareAndModifyPaths: function (sortedData, paths) {
			//TODO (general TGVDs): re-implement for combined rows (different length items which we take from paths and sortedData can be)
			//we need to use metadata here.
			for (let i = 0; i < sortedData.length; i++) {
				let dataItemPath = this._getPathFromDataItem(sortedData[i]);
				if (paths[i] !== dataItemPath) {
					return false;
				}
			}

			for (let i = 0; i < sortedData.length; i++) {
				paths.shift();
			}

			return true;
		},

		_expandRecursivelyByPaths: function (paths) {
			let gridRowId = this._mainPage._grid._grid.settings.selectedRows[0];
			let row = this._mainPage._grid._grid.rows.get(gridRowId);
			this._compareAndExpandArray(paths, row.children);
		},

		setSpecialQueryItemRefId: function (refId) {
			this._specialRowRefId = refId;
		}
	});
});
