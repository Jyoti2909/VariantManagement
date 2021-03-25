define(function () {
	function _addEventListeners(subject, listeners) {
		var eventType;
		for (eventType in listeners) {
			dojo.connect(subject, eventType, listeners[eventType]);
		}
	}

	function _fillTarget(target, adapter) {
		var eventType;
		for (eventType in adapter) {
			target[eventType] = function () {};
		}
	}

	function _EventsWrapper(grid, defaultListeners) {
		var _grid = grid,
			_target = {},
			_processEvent = function (rowIndex, callback) {
				var itemWrapper = _grid._by_idx[rowIndex],
					itemId = itemWrapper && itemWrapper.idty;
				if (itemId) {
					return callback(itemId);
				}
			},
			_setOpenState = function (itemId, state) {
				var isNotEditing = !_grid.edit || !_grid.edit.isEditing();
				if (isNotEditing) {
					_grid.setOpenState(itemId, state);
				}
			},
			_moveSelection = function (rowIndex) {
				if (-1 < rowIndex && rowIndex < _grid._size) {
					_grid.selection.select(rowIndex);
				}
			},
			_adapter = {
				canEdit: function (cell, rowIndex) {
					return _processEvent(rowIndex, _target.canEdit);
				},
				onStartEdit: function (cell, rowIndex) {
					return _processEvent(rowIndex, _target.onStartEdit);
				},
				onApplyEdit: function (rowIndex) {
					return _processEvent(rowIndex, _target.onApplyEdit);
				},
				onCancelEdit: function (rowIndex) {
					return _processEvent(rowIndex, _target.onCancelEdit);
				},
				onClick: function (event) {
					var rowNotClicked = 'number' !== typeof event.rowIndex,
						editInProgress = _grid.edit && _grid.edit.isEditing();
					if (rowNotClicked && editInProgress) {
						_grid.edit.apply();
					}
				},
				onRowClick: function (event) {
					return _processEvent(event.rowIndex, _target.onRowClick);
				},
				onRowDblClick: function (event) {
					return _processEvent(event.rowIndex, _target.onRowDblClick);
				},
				onRowContextMenu: function (event) {
					return _processEvent(event.rowIndex, function (itemId) {
						var gridView = _grid.views.views[_grid.views.views.length - 1],
							rowIndex = event.rowIndex,
							menuParams = {
								node: gridView.rowNodes[rowIndex],
								x: event.pageX,
								y: event.pageY
							};
						_grid.selection.select(rowIndex);
						return _target.onRowContextMenu(itemId, menuParams);
					});
				},
				onStyleRow: function (row) {
					return _processEvent(row.index, function (itemId) {
						return _target.onStyleRow(itemId, row);
					});
				},
				onBuildRow: function (rowIndex, rowNode) {
					return _processEvent(rowIndex, function (itemId) {
						return _target.onBuildRow(itemId, rowNode);
					});
				},
				onKeyDown: function (event) {
					var keyCode = event.keyCode,
						rowIndex = _grid.selection.selectedIndex;
					rowIndex =
						'number' === typeof rowIndex &&
						!isNaN(rowIndex) &&
						-1 < rowIndex &&
						rowIndex < _grid._size
							? rowIndex
							: 0;
					return _processEvent(rowIndex, function (itemId) {
						switch (keyCode) {
							case 37:
								/* left arrow */
								_setOpenState(itemId, false);
								break;
							case 38:
								/* "top" arrow */
								_moveSelection(rowIndex - 1);
								break;
							case 39:
								/* right arrow */
								_setOpenState(itemId, true);
								break;
							case 40:
								/* down arrow */
								_moveSelection(rowIndex + 1);
								break;
						}
						return _target.onKeyDown(itemId, keyCode);
					});
				}
			};

		if (!_grid) {
			throw new Error(
				'Not all required arguments were passed to EventsWrapper-constructor!'
			);
		}

		_fillTarget(_target, _adapter);
		_addEventListeners(_grid, _adapter);
		if (defaultListeners) {
			_addEventListeners(_target, defaultListeners);
		}

		return {
			addListener: function (eventName, listener) {
				dojo.connect(_target, eventName, listener);
			},
			addListeners: function (listeners) {
				_addEventListeners(_target, listeners);
			}
		};
	}

	return dojo.declare('EventsWrapper', null, {
		constructor: function (grid, defaultListeners) {
			var publicAPI = _EventsWrapper.call(this, grid, defaultListeners),
				propName;
			for (propName in publicAPI) {
				this[propName] = publicAPI[propName];
			}
		}
	});
});
