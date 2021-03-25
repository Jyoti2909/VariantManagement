var controlFormHandlers = {
	xClassesListChange: function (initialProps, e) {
		var newXClasses = e.detail.newXClasses;
		var removedXClasses = e.detail.removedXClasses;
		var relationshipType = document.item.getAttribute('type') + '_xClass';

		var item = aras.newIOMItem();
		item.node = document.item;

		newXClasses.forEach(function (xClassId) {
			var deletedRelationshipNode = document.item.selectSingleNode(
				'Relationships/Item[@type="' +
					relationshipType +
					'" and (related_id="' +
					xClassId +
					'" or related_id/Item/id="' +
					xClassId +
					'")]'
			);
			if (deletedRelationshipNode) {
				if (deletedRelationshipNode.getAttribute('action') === 'skip') {
					deletedRelationshipNode.setAttribute('action', 'add');
				} else {
					deletedRelationshipNode.removeAttribute('action');
				}
			} else {
				var relationshipItem = aras.newIOMItem(relationshipType, 'add');
				relationshipItem.setProperty('related_id', xClassId);
				item.addRelationship(relationshipItem);
			}
		});

		removedXClasses.forEach(function (xClassId) {
			var relationshipNode = document.item.selectSingleNode(
				'Relationships/Item[@type="' +
					relationshipType +
					'" and (related_id="' +
					xClassId +
					'" or related_id/Item/id="' +
					xClassId +
					'")]'
			);
			if (relationshipNode) {
				if (relationshipNode.getAttribute('isNew') === '1') {
					relationshipNode.setAttribute('action', 'skip');
				} else {
					relationshipNode.setAttribute('action', 'delete');
				}
			}
		});

		if (newXClasses.length || removedXClasses.length) {
			document.item.setAttribute('isDirty', '1');
			xPropertiesUtils.sortXClassRelationships(document.item);
		}

		if (newXClasses.length) {
			var xClassXPropertiesData = xPropertiesUtils.getMetadataForXClassesControl(
				newXClasses
			);
			xClassXPropertiesData.forEach(function (xClassData) {
				xClassData.properties.forEach(function (propertyData) {
					if (
						propertyData.default_value &&
						aras.getItemProperty(document.item, propertyData.name, null) ===
							null
					) {
						aras.setItemProperty(
							document.item,
							propertyData.name,
							propertyData.default_value
						);
						initialProps[propertyData.name] = propertyData.default_value;
					}
				});
			});

			var xPropNodes = ArasModules.xml.selectNodes(
				document.item,
				'./*[starts-with(name(),"xp-")]'
			);
			var propsValuesHash = xPropNodes.reduce(function (res, xPropNode) {
				res[xPropNode.nodeName] = xPropNode.text;
				return res;
			}, {});

			xClassesControl.setFieldsValues(propsValuesHash);
		}
	},
	xPropertyChange: function (e) {
		let newValue = e.detail.newValue;
		let isValueValid = true;

		if (e.detail.data_type === 'item' && newValue) {
			const selectedItem = aras.uiGetItemByKeyedName(
				e.detail.dataSourceName,
				newValue
			);
			if (!selectedItem) {
				isValueValid = false;
				e.detail.validationMessage = aras.getResource(
					'',
					'relationshipsgrid.value_not_exist_for_it',
					e.detail.dataSourceName
				);
			} else {
				newValue = selectedItem.getAttribute('id');
			}
		}

		let valueInNeutral;
		if (isValueValid) {
			if (
				e.detail.data_type === 'date' ||
				e.detail.data_type === 'decimal' ||
				e.detail.data_type === 'float'
			) {
				valueInNeutral = aras.convertToNeutral(
					newValue,
					e.detail.data_type,
					e.detail.pattern
				);
			} else {
				valueInNeutral = newValue;
			}
			isValueValid = aras.isPropertyValueValid(e.detail, valueInNeutral);
			e.detail.validationMessage = aras.ValidationMsg;
		}
		if (!e.detail.preValidationResult || !isValueValid) {
			var mostTopWindow = aras.getMostTopWindowWithAras();
			var confirmDialog = (
				mostTopWindow.main || mostTopWindow
			).ArasModules.Dialog.show('iframe', {
				buttons: {
					btnYes: aras.getResource('', 'common.ok'),
					btnCancel: aras.getResource('', 'common.cancel')
				},
				defaultButton: 'btnCancel',
				aras: aras,
				center: true,
				dialogHeight: 180,
				dialogWidth: 300,
				message: e.detail.preValidationResult
					? e.detail.validationMessage
					: aras.getResource(
							'../Modules/aras.innovator.ExtendedClassification/',
							'xClassesControl.value_not_exist_for_it',
							e.detail.xPropertyName
					  ),
				content: 'groupChgsDialog.html'
			});
			confirmDialog.promise.then(
				function (result) {
					var oldValue = aras.getItemProperty(
						document.item,
						e.detail.xPropertyName
					);
					if (result === 'btnYes') {
						if (e.detail.data_type === 'item' && oldValue) {
							oldValue = aras.getKeyedName(oldValue, e.detail.dataSourceName);
						}
						xClassesControl.invalidateField(e.detail.xPropertyId, oldValue);
					} else {
						xClassesControl.setPropertyValue(e.detail.xPropertyName, oldValue);
					}
				}.bind(this)
			);
		} else {
			if (e.detail.data_type === 'item') {
				controlFormHandlers.setItemXProperty(
					document.item,
					e.detail.xPropertyName,
					valueInNeutral,
					e.detail.newValue,
					true
				);
			} else {
				aras.setItemProperty(
					document.item,
					e.detail.xPropertyName,
					valueInNeutral
				);
				aras.setItemPropertyAttribute(
					document.item,
					e.detail.xPropertyName,
					'set',
					'value'
				);
			}
		}
	},
	refreshXClassesListInControl: function (
		item,
		relationshipType,
		xClassesControl,
		initialData
	) {
		const xClassesInfo = xPropertiesUtils.getXClassesForItem(
			item,
			relationshipType
		);
		const xClassIDs = xClassesInfo.xClassIDs;
		const removedXClasses = xClassesInfo.removedXClasses;

		if (xClassIDs.length) {
			var xTreesMetadata = aras.MetadataCache.GetAllXClassificationTrees();
			var xClassesSelectCondition = xClassIDs
				.map(function (e) {
					return '@id="' + e + '"';
				})
				.join(' or ');
			var xClassNodes = ArasModules.xml.selectNodes(
				xTreesMetadata,
				'Item[@type="xClassificationTree"]/Relationships/Item[@type="xClass" and (' +
					xClassesSelectCondition +
					')]'
			);

			if (xClassNodes.length !== xClassIDs.length) {
				aras.MetadataCache.DeleteXClassificationTreesDates();
				xTreesMetadata = aras.MetadataCache.GetAllXClassificationTrees();
				xClassNodes = ArasModules.xml.selectNodes(
					xTreesMetadata,
					'Item[@type="xClassificationTree"]/Relationships/Item[@type="xClass" and (' +
						xClassesSelectCondition +
						')]'
				);

				if (xClassNodes.length !== xClassIDs.length) {
					var errorMessage = aras.getResource(
						'../Modules/aras.innovator.ExtendedClassification/',
						'xClassesControl.invalid_xclass_on_item'
					);
					return aras.AlertError(errorMessage).then(function () {
						return Promise.reject(errorMessage);
					});
				}
			}
		}

		var xPropertiesNames = xPropertiesUtils.getSetOfXPropertiesNamesForXClasses(
			xClassIDs
		);
		var xPropertiesValues = {};
		xPropertiesNames.forEach(function (xPropertyName) {
			xPropertiesValues[xPropertyName] = aras.getItemProperty(
				item,
				xPropertyName
			);
		});

		var restrictedFields = ArasModules.xml
			.selectNodes(item, './*[starts-with(name(),"xp-") and @is_null="0"]')
			.map(function (fieldNode) {
				return fieldNode.nodeName;
			});

		const discoverOnlyFields = ArasModules.xml
			.selectNodes(
				item,
				'./*[starts-with(name(),"xp-") and @discover_only="1"]'
			)
			.map(function (fieldNode) {
				return fieldNode.nodeName;
			});

		return xClassesControl
			.init(
				xClassIDs,
				Object.assign(
					{
						removedXClasses: removedXClasses,
						restrictedFields: restrictedFields,
						discoverOnlyFields: discoverOnlyFields
					},
					initialData
				)
			)
			.then(function () {
				xClassesControl.setFieldsValues(xPropertiesValues);
			});
	},
	refreshXPropertiesPermissions: function (
		item,
		xClassesControl,
		needRefreshInitPermissions,
		initialPermissions
	) {
		const itemProperties = xPropertiesUtils.getDefinedXProperties(item);
		let xPropertiesPermissions = {};
		let itemWithAllXProps = aras.newIOMItem(item.getAttribute('type'), 'get');
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
			ArasModules.xml
				.selectNodes(itemWithAllXProps.node, './*[starts-with(name(),"xp-")]')
				.forEach(function (xPropNode) {
					xPropertiesPermissions[xPropNode.tagName] = xPropNode.getAttribute(
						'permission_id'
					);
				});
			if (needRefreshInitPermissions) {
				xPropertiesUtils.refreshInitXPropertiesPermissions(
					itemWithAllXProps.node,
					initialPermissions
				);
			}
		}

		if (aras.isDirtyEx(item)) {
			ArasModules.xml
				.selectNodes(item, './*[starts-with(name(),"xp-")]')
				.forEach(function (xPropNode) {
					xPropertiesPermissions[xPropNode.tagName] = xPropNode.getAttribute(
						'permission_id'
					);
				});
		}

		return xClassesControl.setFieldsPermissions(xPropertiesPermissions);
	},
	xPropertyReset: function (initialPropsValues, initialPropsPermissions, e) {
		var confirmDialog = aras
			.getMostTopWindowWithAras()
			.ArasModules.Dialog.show('iframe', {
				buttons: {
					btnYes: aras.getResource('', 'common.ok'),
					btnCancel: aras.getResource('', 'common.cancel')
				},
				defaultButton: 'btnCancel',
				aras: aras,
				center: true,
				dialogHeight: 180,
				dialogWidth: 300,
				message: aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification/',
					'xClassesControl.property_reset_confirm_message',
					e.detail.xPropertyLabel
				),
				content: 'groupChgsDialog.html'
			});

		return confirmDialog.promise.then(function (result) {
			if (result === 'btnYes') {
				var propName = e.detail.xPropertyName;
				var xPropNode;
				xPropNode = document.item.selectSingleNode(propName);

				if (xPropNode) {
					xPropNode.removeAttribute('set');
					xPropNode.removeAttribute('explicit');
					xPropNode.removeAttribute('permission_id');

					if (initialPropsValues[propName + '@restricted']) {
						xClassesControl.setPropertyValue(propName, '');
						xClassesControl.setPropertyRestrictedState(propName, true);
						xPropNode.text = '';
						xPropNode.setAttribute('is_null', 0);
					} else {
						switch (initialPropsValues[propName]) {
							case undefined:
								xPropNode.parentNode.removeChild(xPropNode);
								xClassesControl.setPropertyValue(propName, '');
								break;
							case null:
								xPropNode.text = '';
								xPropNode.setAttribute('is_null', 1);
								xClassesControl.setPropertyValue(propName, '');
								break;
							default:
								if (e.detail.xPropertyType === 'item') {
									controlFormHandlers.setItemXProperty(
										document.item,
										propName,
										initialPropsValues[propName],
										null,
										false
									);
								} else {
									xPropNode.text = initialPropsValues[propName];
								}
								xClassesControl.setPropertyValue(
									propName,
									initialPropsValues[propName]
								);
						}
					}

					xClassesControl.setPropertyPermission(
						propName,
						initialPropsPermissions[propName]
					);
				}
			}
		});
	},
	xPropertyViewPermission: function (e) {
		const propName = e.detail.xPropertyName;
		const existingPermissionId = e.detail.xPropertyPermissionId;

		if (existingPermissionId) {
			aras.uiShowItem('Permission_PropertyValue', existingPermissionId);
		} else {
			return;
		}
	},
	xPropertyCreatePermission: function (e) {
		const newItemNd = aras.newItem('Permission_PropertyValue');
		aras.itemsCache.addItem(newItemNd);
		aras.setItemProperty(newItemNd, 'locked_by_id', aras.getCurrentUserID());
		aras.uiShowItemEx(newItemNd, 'new');
		const resultPromise = Promise.resolve(newItemNd);

		if (resultPromise) {
			resultPromise.then(function (item) {
				if (!item) {
					return;
				}

				const permissionId = item.getAttribute('id');
				const propName = e.detail.xPropertyName;

				xClassesControl.setPropertyPermission(propName, permissionId);

				let xPropNode = document.item.selectSingleNode(propName);
				if (!xPropNode) {
					let xmlDoc = new XmlDocument();
					xPropNode = xmlDoc.createElement(propName);
					document.item.appendChild(xPropNode);
				}
				xPropNode.setAttribute('set', 'permission_id');
				xPropNode.setAttribute('permission_id', permissionId);
				document.item.setAttribute('isDirty', '1');
			});
		}
	},
	xPropertyPickReplacePermission: function (e) {
		const params = {
			aras: window.aras,
			itemtypeName: 'Permission_PropertyValue',
			type: 'SearchDialog'
		};
		const topWindow = aras.getMostTopWindowWithAras(window);
		const resultPromise = topWindow.ArasModules.MaximazableDialog.show(
			'iframe',
			params
		).promise;

		if (resultPromise) {
			resultPromise.then(function (item) {
				if (!item) {
					return;
				}

				const propName = e.detail.xPropertyName;

				xClassesControl.setPropertyPermission(propName, item.itemID);

				let xPropNode = document.item.selectSingleNode(propName);
				if (!xPropNode) {
					let xmlDoc = new XmlDocument();
					xPropNode = xmlDoc.createElement(propName);
					document.item.appendChild(xPropNode);
				}
				xPropNode.setAttribute('set', 'permission_id');
				xPropNode.setAttribute('permission_id', item.itemID);
				document.item.setAttribute('isDirty', '1');
			});
		}
	},
	formOnLoadHandler: function () {
		var xPropsInitialValues = {};
		var xPropsInitialPermissions = {};
		var currentType = document.item.getAttribute('type');
		const itemId = document.item.getAttribute('id');
		var relationshipType = currentType + '_xClass';
		var xClassFieldNd = document.formNd.selectSingleNode(
			'//Item[@type="Field" and field_type="xclass"]'
		);
		var controlInitialData = {
			textWidth: +aras.getItemProperty(xClassFieldNd, 'xclass_text_width', 100),
			fieldWidth: +aras.getItemProperty(
				xClassFieldNd,
				'xclass_field_width',
				126
			)
		};

		const typeId = aras.getItemTypeId(document.item.getAttribute('type'));
		if (xPropertiesUtils.isItemTypeAllowedOnTree(typeId)) {
			var mainWnd = aras.getMostTopWindowWithAras(window);

			const baseCommands = {
				onLockCommand: mainWnd.onLockCommand,
				onUnlockCommand: mainWnd.onUnlockCommand,
				onSaveCommand: mainWnd.onSaveCommand,
				onSaveUnlockAndExitCommand: mainWnd.onSaveUnlockAndExitCommand,
				onUndoCommand: mainWnd.onUndoCommand
			};
			mainWnd.onLockCommand = function (saveChanges) {
				var baseResult = baseCommands.onLockCommand(saveChanges);
				aras.getItemRelationshipsEx(document.item, relationshipType);

				controlFormHandlers.refreshXClassesListInControl(
					document.item,
					relationshipType,
					xClassesControl,
					Object.assign({ isEditMode: document.isEditMode }, controlInitialData)
				);
				xPropertiesUtils.refreshInitXPropertiesValues(
					document.item,
					xPropsInitialValues
				);
				xPropertiesUtils.refreshInitXPropertiesPermissions(
					document.item,
					xPropsInitialPermissions,
					true
				);
				return baseResult;
			};

			mainWnd.onUnlockCommand = function (saveChanges) {
				let unlockPromise;

				if (saveChanges) {
					unlockPromise = xPropertiesUtils
						.checkPropertiesBeforeItemSave(document.item, xClassesControl)
						.then(function (result) {
							if (result) {
								return Promise.resolve(
									baseCommands.onUnlockCommand(saveChanges)
								);
							}
						});
				} else {
					unlockPromise = Promise.resolve(
						baseCommands.onUnlockCommand(saveChanges)
					);
				}

				unlockPromise.then(function (result) {
					if (document.item.getAttribute('isDirty') !== '1') {
						aras.getItemRelationshipsEx(document.item, relationshipType);

						controlFormHandlers.refreshXClassesListInControl(
							document.item,
							relationshipType,
							xClassesControl,
							Object.assign(
								{ isEditMode: document.isEditMode },
								controlInitialData
							)
						);
						xPropertiesUtils.refreshInitXPropertiesValues(
							document.item,
							xPropsInitialValues
						);

						controlFormHandlers.refreshXPropertiesPermissions(
							document.item,
							xClassesControl,
							true,
							xPropsInitialPermissions
						);
					}

					return result;
				});
			};

			mainWnd.onSaveCommand = function () {
				return xPropertiesUtils
					.checkPropertiesBeforeItemSave(document.item, xClassesControl)
					.then(function (result) {
						if (result) {
							return baseCommands.onSaveCommand();
						}
					})
					.then(function (result) {
						// now we can't detect that server error has occured on save command by returned value
						// if item was not saved (error has occured) isDirty attribute will stay on the item
						// this check is needed to avoid unnecessary request to item xClass relationships
						if (document.item.getAttribute('isDirty') !== '1') {
							aras.getItemRelationshipsEx(document.item, relationshipType);

							controlFormHandlers.refreshXClassesListInControl(
								document.item,
								relationshipType,
								xClassesControl,
								Object.assign(
									{ isEditMode: document.isEditMode },
									controlInitialData
								)
							);
							xPropertiesUtils.refreshInitXPropertiesValues(
								document.item,
								xPropsInitialValues
							);

							controlFormHandlers.refreshXPropertiesPermissions(
								document.item,
								xClassesControl,
								true,
								xPropsInitialPermissions
							);
						}

						return result;
					});
			};

			mainWnd.onSaveUnlockAndExitCommand = function () {
				return xPropertiesUtils
					.checkPropertiesBeforeItemSave(document.item, xClassesControl)
					.then(function (result) {
						if (result) {
							return baseCommands.onSaveUnlockAndExitCommand();
						}
					})
					.then(function (result) {
						// now we can't detect that server error has occured on save command by returned value
						// if item was not saved (error has occured) isDirty attribute will stay on the item
						// this check is needed to avoid unnecessary request to item xClass relationships
						if (document.item.getAttribute('isDirty') !== '1') {
							aras.getItemRelationshipsEx(document.item, relationshipType);

							controlFormHandlers.refreshXClassesListInControl(
								document.item,
								relationshipType,
								xClassesControl,
								Object.assign(
									{ isEditMode: document.isEditMode },
									controlInitialData
								)
							);

							controlFormHandlers.refreshXPropertiesPermissions(
								document.item,
								xClassesControl
							);
						}

						return result;
					});
			};

			mainWnd.onUndoCommand = function (silentMode) {
				var baseResult = baseCommands.onUndoCommand(silentMode);
				aras.getItem(
					currentType,
					'@id="' + itemId + '"',
					'<id>' +
						itemId +
						'</id><Relationships><Item type="' +
						relationshipType +
						'" action="get" /></Relationships>',
					undefined,
					undefined,
					'xp-*[is_not_null()]'
				);

				controlFormHandlers.refreshXClassesListInControl(
					document.item,
					relationshipType,
					xClassesControl,
					Object.assign({ isEditMode: document.isEditMode }, controlInitialData)
				);
				xPropertiesUtils.refreshInitXPropertiesValues(
					document.item,
					xPropsInitialValues
				);

				controlFormHandlers.refreshXPropertiesPermissions(
					document.item,
					xClassesControl,
					true,
					xPropsInitialPermissions
				);

				return baseResult;
			};

			if (
				!aras.isTempEx(document.item) &&
				(!aras.isDirtyEx(document.item) ||
					aras.getRelationships(document.item, relationshipType).length === 0)
			) {
				aras.getItemRelationshipsEx(document.item, relationshipType);
				controlFormHandlers.fillItemByXProperties(document.item);
			}

			document.addEventListener(
				'xclasses-list-change',
				controlFormHandlers.xClassesListChange.bind(null, xPropsInitialValues)
			);
			document.addEventListener(
				'xproperty-change',
				controlFormHandlers.xPropertyChange
			);
			document.addEventListener(
				'xproperty-reset',
				controlFormHandlers.xPropertyReset.bind(
					null,
					xPropsInitialValues,
					xPropsInitialPermissions
				)
			);
			document.addEventListener(
				'xproperty-view-permission',
				controlFormHandlers.xPropertyViewPermission.bind(null)
			);
			document.addEventListener(
				'xproperty-create-permission',
				controlFormHandlers.xPropertyCreatePermission.bind(null)
			);
			document.addEventListener(
				'xproperty-pickreplace-permission',
				controlFormHandlers.xPropertyPickReplacePermission.bind(null)
			);
			window.addEventListener('unload', function () {
				Object.assign(mainWnd, baseCommands);
			});

			return controlFormHandlers
				.refreshXClassesListInControl(
					document.item,
					relationshipType,
					xClassesControl,
					Object.assign(
						{
							isEditMode: document.isEditMode,
							isDisabled:
								aras.getItemProperty(xClassFieldNd, 'is_disabled') === '1'
						},
						controlInitialData
					)
				)
				.then(function () {
					return xPropertiesUtils.refreshInitXPropertiesValues(
						document.item,
						xPropsInitialValues
					);
				})
				.then(function () {
					return controlFormHandlers.refreshXPropertiesPermissions(
						document.item,
						xClassesControl,
						true,
						xPropsInitialPermissions
					);
				});
		}

		return Promise.resolve();
	},
	fillItemByXProperties: function (item) {
		const currentType = item.getAttribute('type');
		const itemId = item.getAttribute('id');
		const itemProperties = xPropertiesUtils.getDefinedXProperties(item);

		const newItemNd = aras.getItem(
			currentType,
			'@id="' + itemId + '"',
			'<id>' + itemId + '</id>',
			0,
			undefined,
			itemProperties
				.map(function (property) {
					return property.name + '[is_not_null()]';
				})
				.join(',')
		);
		aras.mergeItem(item, newItemNd);
	},
	setItemXProperty: function (itemNd, propertyName, id, keyedName, doSetValue) {
		aras.setItemProperty(itemNd, propertyName, id);
		if (doSetValue) {
			aras.setItemPropertyAttribute(itemNd, propertyName, 'set', 'value');
		}
		if (!keyedName) {
			xClassesControl._nav.data.forEach(function (prop) {
				if (!prop.children && prop.field.data.name === propertyName) {
					keyedName = aras.getKeyedName(id, prop.field.data.dataSourceName);
				}
			});
		}
		aras.setItemPropertyAttribute(
			itemNd,
			propertyName,
			'keyed_name',
			keyedName
		);
	}
};
