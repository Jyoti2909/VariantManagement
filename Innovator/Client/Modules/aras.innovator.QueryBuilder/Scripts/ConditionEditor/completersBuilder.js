define(['./snippets'], function (SnippetManager) {
	var operationList = ['<', '<=', '=', '>', '>=', '!=', 'LIKE', 'IS NULL'];
	var binaryOperationList = ['AND', 'OR', 'NOT'];
	function getToken(editor, pos, itemList) {
		function cleanTokenValue(value) {
			return value && value.replace('[', '').replace(']', '').replace('.', '');
		}
		var token = editor.getSession().getTokenAt(pos.row, pos.column);
		if (!token) {
			return 'item';
		}
		if (token.type === 'item') {
			return cleanTokenValue(token.value);
		}
		var prevToken = editor.getSession().getTokenAt(pos.row, token.start);

		if (prevToken.type === 'item' && token.value.indexOf(']') < 0) {
			return cleanTokenValue(prevToken.value);
		}

		if (token) {
			var items = itemList.join(',').toLowerCase();
			if (items.indexOf(token.value.toLowerCase()) >= 0) {
				return 'item';
			}
		}
		if (token.value === ' ') {
			return 'item';
		}
	}
	var snippets = new SnippetManager().getSnippets();
	return {
		build: function (dataSource) {
			//todo: review and rework
			var itemList = dataSource
				.filter(function (item) {
					return item.properties;
				})
				.map(function (item) {
					return item.name;
				});
			var propertyList = dataSource
				.filter(function (item) {
					return item.properties;
				})
				.reduce(function (acc, value) {
					acc[value.name] = value.properties.map(function (prop) {
						return prop.label;
					});
					return acc;
				}, {});
			propertyList.item = dataSource
				.filter(function (item) {
					return !item.properties;
				})
				.map(function (prop) {
					return prop.name;
				});
			var completers = [];
			completers.push({
				getCompletions: function (editor, session, pos, prefix, callback) {
					var obj = editor.getSession().getTokenAt(pos.row, pos.column);
					if (obj && obj.value === ' ') {
						var prevObj = editor.getSession().getTokenAt(pos.row, obj.start);
						if (
							!prevObj ||
							(prevObj &&
								prevObj.type !== 'keyword.operator' &&
								prevObj.type !== 'keyword')
						) {
							callback(
								null,
								operationList.map(function (word) {
									return {
										caption: word.toLowerCase(),
										value: word.toUpperCase(),
										meta: 'operations'
									};
								})
							);
						}
					}
				}
			});
			completers.push({
				getCompletions: function (editor, session, pos, prefix, callback) {
					var token = getToken(editor, pos, itemList);
					var obj = editor.getSession().getTokenAt(pos.row, pos.column);
					if (
						!obj ||
						(obj && obj.value === ' ') ||
						(obj &&
							obj.type === 'identifier' &&
							binaryOperationList.join(',').indexOf(obj.value) >= 0 &&
							token !== 'item' &&
							itemList.join(',').indexOf(token) < 0)
					) {
						var prevObj;
						if (obj) {
							prevObj = editor.getSession().getTokenAt(pos.row, obj.start);
						}
						if (
							!prevObj ||
							(prevObj &&
								prevObj.type !== 'keyword.operator' &&
								prevObj.type !== 'keyword')
						) {
							callback(
								null,
								binaryOperationList.map(function (word) {
									return {
										caption: word.toLowerCase(),
										snippet: snippets[word.toLowerCase()] || word,
										value: word.toLowerCase(),
										meta: 'operations'
									};
								})
							);
						}
					}
				}
			});
			completers.push({
				getCompletions: function (editor, session, pos, prefix, callback) {
					var token = getToken(editor, pos, itemList);
					if (token === 'item') {
						callback(
							null,
							itemList.map(function (word) {
								return {
									caption: word,
									value: word.indexOf(' ') >= 0 ? '[' + word + ']' : word,
									meta: 'item'
								};
							})
						);
					}
				}
			});
			completers.push({
				getCompletions: function (editor, session, pos, prefix, callback) {
					var token = getToken(editor, pos, itemList) || 'item';
					var obj = editor.getSession().getTokenAt(pos.row, pos.column);
					if (obj && obj.value.length + obj.start > pos.column) {
						return;
					}
					if (propertyList[token]) {
						callback(
							null,
							propertyList[token].map(function (word) {
								return {
									caption: word,
									value:
										(word.indexOf(' ') >= 0 ||
											word.toLowerCase().startsWith('xp-')) &&
										word.toLowerCase().indexOf('count') === 0 &&
										word.toLowerCase().indexOf('min') === 0 &&
										word.toLowerCase().indexOf('max') === 0 &&
										word.toLowerCase().indexOf('exists') === 0
											? '[' + word + ']'
											: word,
									meta: token,
									completer: {
										insertMatch: function (editor, data) {
											var pos = editor.getCursorPosition();
											var token = editor.session.getTokenAt(
												pos.row,
												pos.column
											);
											if (token && token.type === 'identifier') {
												var Range = ace.require('ace/range').Range;
												var tokenRange = new Range(
													pos.row,
													token.start,
													pos.row,
													pos.column
												);
												editor.session.replace(tokenRange, data.value);
											} else {
												editor.insert(data.value);
											}
										}
									}
								};
							})
						);
					}
				}
			});
			return completers;
		}
	};
});
