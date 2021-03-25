/* global ace */
define([], function () {
	const lang = ace.require('ace/lib/lang');
	const modulePath = '../Modules/aras.innovator.MacPolicy/';
	const operationList = ['<', '<=', '=', '>', '>=', '!=', 'LIKE', 'IS NULL'];
	const binaryOperationList = ['AND', 'OR', 'NOT'];
	const functionList = {
		CurrentUser: ['IsMemberOf', 'IsXPropertyDefined', 'IsClassifiedByXClass'],
		CurrentItem: [
			'HasUserVisibilityPolicyAccess',
			'IsXPropertyDefined',
			'IsClassifiedByXClass'
		],
		String: ['Contains'],
		Collection: ['Overlaps', 'Contains', 'IsEmpty']
	};
	function getToken(editor, pos, itemList) {
		const token = editor.getSession().getTokenAt(pos.row, pos.column);
		if (!token) {
			return 'item.name';
		}
		if (token.type === 'item.name') {
			return beautifyToken(token.value);
		}
		const prevToken = editor.getSession().getTokenAt(pos.row, token.start);

		if (prevToken.type === 'item.name' && token.value.indexOf(']') < 0) {
			return beautifyToken(prevToken.value);
		}
		if (token) {
			if (isSetInList(itemList, token.value)) {
				return 'item.name';
			}
			if (token.value === '(') {
				return 'item.name';
			}
		}
		if (beautifyToken(token.value) === ' ') {
			return 'item.name';
		}
	}

	function formatDataTypeLabel(dataType) {
		return (
			'<b>' +
			lang.escapeHTML(
				aras.getResource(
					modulePath,
					'condition_editor.autocomplete.property.type_info',
					dataType
				)
			) +
			'</b>'
		);
	}

	function beautifyToken(token) {
		return token.replace(/[\s().]/g, '');
	}

	function isSetInList(list, value) {
		value = beautifyToken(value).toUpperCase();
		function startsWith(element) {
			return element.toUpperCase().startsWith(value);
		}
		return list.some(startsWith);
	}

	function getOperationsCompleter() {
		return {
			getCompletions: function (editor, session, pos, prefix, callback) {
				const obj = editor.getSession().getTokenAt(pos.row, pos.column);
				if (obj && beautifyToken(obj.value) === '') {
					const prevObj = editor.getSession().getTokenAt(pos.row, obj.start);
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
									meta: aras.getResource(
										modulePath,
										'condition_editor.autocomplete.operator.meta'
									)
								};
							})
						);
					}
				}
			}
		};
	}

	function getBinaryOperationsCompleter() {
		return {
			getCompletions: function (editor, session, pos, prefix, callback) {
				const obj = editor.getSession().getTokenAt(pos.row, pos.column);
				const isText =
					(obj && obj.value.replace(')', '') === ' ') ||
					(obj && obj.type === 'text');
				const isBinaryOperation =
					obj && isSetInList(binaryOperationList, obj.value);
				if (!obj || (isText && isBinaryOperation)) {
					let prevObj;
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
									caption: word,
									snippet: word + ' ($0)',
									value: word,
									meta: aras.getResource(
										modulePath,
										'condition_editor.autocomplete.operator.meta'
									)
								};
							})
						);
					}
				}
			}
		};
	}

	function getItemsCompleter(itemList) {
		return {
			getCompletions: function (editor, session, pos, prefix, callback) {
				const token = getToken(editor, pos, itemList);
				const obj = editor.getSession().getTokenAt(pos.row, pos.column);
				if (
					token === 'item.name' ||
					(obj && obj.value.trim() === ',') ||
					(obj && obj.type === 'item.function.start')
				) {
					callback(
						null,
						itemList.map(function (word) {
							if (word.indexOf(' ') >= 0) {
								return {
									caption: word,
									value: '[' + word + ']',
									meta: aras.getResource(
										modulePath,
										'condition_editor.autocomplete.item.meta'
									)
								};
							}
							return {
								caption: word,
								value: word,
								meta: aras.getResource(
									modulePath,
									'condition_editor.autocomplete.item.meta'
								)
							};
						})
					);
				}
			}
		};
	}

	function getPropertiesCompleter(itemList, propertyList) {
		return {
			getCompletions: function (editor, session, pos, prefix, callback) {
				const token = getToken(editor, pos, itemList);
				const obj = editor.getSession().getTokenAt(pos.row, pos.column);
				if (
					obj &&
					(obj.value.length + obj.start > pos.column ||
						obj.type === 'item.function.start')
				) {
					return;
				}
				if (propertyList[token]) {
					callback(
						null,
						propertyList[token].map(function (property) {
							if (
								property.name.indexOf(' ') >= 0 ||
								property.name.startsWith('xp-')
							) {
								return {
									caption: property.name,
									value: '[' + property.name + ']',
									docHTML: formatDataTypeLabel(property.dataType),
									type: property.dataType,
									meta: token,
									completer: {
										insertMatch: function (editor, data) {
											const pos = editor.getCursorPosition();
											const token = editor.session.getTokenAt(
												pos.row,
												pos.column
											);
											if (token.type === 'item.name') {
												editor.insert(data.value);
											} else {
												const Range = ace.require('ace/range').Range;
												const tokenRange = new Range(
													pos.row,
													token.start,
													pos.row,
													pos.column
												);
												editor.session.replace(tokenRange, data.value);
											}
										}
									}
								};
							}
							return {
								caption: property.name,
								value: property.name,
								docHTML: formatDataTypeLabel(property.dataType),
								meta: token,
								completer: {
									insertMatch: function (editor, data) {
										const pos = editor.getCursorPosition();
										const token = editor.session.getTokenAt(
											pos.row,
											pos.column
										);
										if (token.type === 'item.name') {
											editor.insert(data.value);
										} else {
											const Range = ace.require('ace/range').Range;
											const tokenRange = new Range(
												pos.row,
												token.start,
												pos.row,
												pos.column
											);
											editor.session.replace(tokenRange, data.value);
										}
									}
								}
							};
						})
					);
				}
			}
		};
	}

	function getFunctionsCompleter(itemList) {
		return {
			getCompletions: function (editor, session, pos, prefix, callback) {
				const token = getToken(editor, pos, itemList);
				const obj = editor.getSession().getTokenAt(pos.row, pos.column);
				if (
					obj &&
					(obj.value.length + obj.start > pos.column ||
						obj.type === 'item.function.start')
				) {
					return;
				}
				let prevObj;
				if (obj) {
					prevObj = editor.getSession().getTokenAt(pos.row, obj.start);
				}
				if (
					prevObj &&
					(prevObj.type === 'item.function' ||
						prevObj.type === 'item.function.start')
				) {
					return;
				}
				if (functionList[token]) {
					callback(
						null,
						functionList[token].map(function (functionName) {
							return {
								caption: functionName,
								value: functionName,
								snippet: functionName + '(${0})',
								meta: aras.getResource(
									modulePath,
									'condition_editor.autocomplete.function.meta'
								)
							};
						})
					);
				}
			}
		};
	}

	return {
		build: function (dataSource) {
			const itemList = dataSource
				.filter(function (item) {
					return item.properties;
				})
				.map(function (item) {
					return item.name;
				});
			itemList.push('String');
			itemList.push('Collection');
			const propertyList = dataSource
				.filter(function (item) {
					return item.properties;
				})
				.reduce(function (acc, value) {
					acc[value.name] = value.properties.map(function (prop) {
						return {
							name: prop.label,
							dataType: prop.dataType
						};
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
			const completers = [];
			completers.push(getOperationsCompleter());
			completers.push(getBinaryOperationsCompleter());
			completers.push(getItemsCompleter(itemList));
			completers.push(getPropertiesCompleter(itemList, propertyList));
			completers.push(getFunctionsCompleter(itemList));
			return completers;
		}
	};
});
