define([
	'dojo/_base/declare',
	'dojo/aspect',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, aspect, Eventable, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.Helper.OptionalContentHelper',
		[Eventable],
		{
			_viewmodel: null,
			_displayPreference: null,
			_all: null,
			_documentView: null,
			_optionFamiliesHash: null,
			_optionFamiliesBuilderMethod: null,
			_allConditions: null,

			constructor: function (args) {
				this._viewmodel = args.viewmodel;
				this._all = {};
				this._documentView = {};

				this._allConditions = {
					_conditionCache: {}, //  hash -> blockId -> family name -> family options
					_usedOptionFamilies: {}, //  hash -> family name -> family options -> blockId
					_invalidateUsedOptionFamilies: true,

					set: function (uid, value) {
						this._conditionCache[uid] = value;
						this._invalidateUsedOptionFamilies = true;
					},

					get: function (uid) {
						return this._conditionCache[uid];
					},

					remove: function (uid) {
						delete this._conditionCache[uid];
						this._invalidateUsedOptionFamilies = true;
					},

					_refreshUsedOptionFamiliesIfRequired: function () {
						if (this._invalidateUsedOptionFamilies) {
							var optionFamilies = {};
							var elementUid;
							var elementCondition;
							var familyName;
							var optionValues;
							var optionValue;
							var cell;
							var i;

							for (elementUid in this._conditionCache) {
								elementCondition = this._conditionCache[elementUid];

								for (familyName in elementCondition) {
									optionValues = elementCondition[familyName];
									optionFamilies[familyName] = optionFamilies[familyName] || {};

									for (i = 0; i < optionValues.length; i++) {
										optionValue = optionValues[i];
										cell = optionFamilies[familyName][optionValue];

										if (!cell) {
											cell = [];
											optionFamilies[familyName][optionValue] = cell;
										}

										if (cell.indexOf(elementUid) < 0) {
											cell.push(elementUid);
										}
									}
								}
							}

							this._invalidateUsedOptionFamilies = false;
							this._usedOptionFamilies = optionFamilies;
						}

						return this._usedOptionFamilies;
					},

					GetUsedOptionFamilies: function () {
						var result = {};
						var optionFamily;
						var usedOptionValues;

						this._refreshUsedOptionFamiliesIfRequired();

						for (optionFamily in this._usedOptionFamilies) {
							usedOptionValues = Object.keys(
								this._usedOptionFamilies[optionFamily]
							).slice(0);
							result[optionFamily] = usedOptionValues;
						}

						return result;
					},

					init: false
				};

				aspect.after(
					this._viewmodel,
					'OnElementRegistered',
					this._OnElementRegistered.bind(this),
					true
				);
				aspect.after(
					this._viewmodel,
					'OnElementUnregistered',
					this._OnElementUnregistered.bind(this),
					true
				);

				this.DisplayPreference(args.display);

				if (args.optionFamilies) {
					this._optionFamiliesHash = args.optionFamilies;
				} else {
					this._optionFamiliesBuilderMethod =
						args.optionFamiliesBuilderMethod || 'tp_GetOptionFamilies';
					this._GetAllOptionFamilies();
				}
			},

			_GetAllOptionFamilies: function () {
				var documentItem = this._viewmodel.getDocumentItem();
				var requestAml =
					'<Item type="' +
					documentItem.getAttribute('type') +
					'" action="' +
					this._optionFamiliesBuilderMethod +
					'" id="' +
					documentItem.getAttribute('id') +
					'" />';
				var queryItem = this._viewmodel._aras.newIOMItem();
				var resultStr;

				queryItem.loadAML(requestAml);
				queryItem = queryItem.apply();

				if (!queryItem.isError()) {
					resultStr = queryItem.getResult();
					this._optionFamiliesHash = JSON.parse(resultStr);
				} else {
					this._viewmodel._aras.AlertError(queryItem.getErrorString());
				}
			},

			UsedOptionFamilies: function () {
				if (!this._allConditions.init) {
					var elementUid;
					var schemaElement;

					for (elementUid in this._all) {
						schemaElement = this._all[elementUid];

						//do nothing with result, method is called only for caching existing conditions
						this.GetElementCondition(schemaElement);
					}

					this._allConditions.init = true;
				}

				return this._allConditions.GetUsedOptionFamilies();
			},

			RootOptionFamilies: function () {
				var rootBlockElement = this._viewmodel.Dom();
				var rootCondition = rootBlockElement.Condition();

				return rootCondition ? JSON.parse(rootCondition) : {};
			},

			OptionFamilies: function () {
				return this._optionFamiliesHash;
			},

			DocumentView: function (value) {
				if (value === undefined) {
					return this._documentView;
				} else {
					this._documentView = value;
				}
			},

			_OnElementRegistered: function (sender, earg) {
				this.trackConditionHandler(earg.registeredObject);
			},

			_OnElementUnregistered: function (sender, earg) {
				this.trackConditionHandler(earg.registeredObject, true);
			},

			DisplayPreference: function (value) {
				if (value === undefined) {
					return this._displayPreference;
				} else {
					if (
						value == Enums.DisplayType.Inactive ||
						value == Enums.DisplayType.Hidden
					) {
						this._displayPreference = value;
						this._recalculateDisplay();

						this.raiseEvent('onDisplayChanged', value);
					} else {
						throw new Error(
							'DisplayPreference argument out of range exception: Inactive or Hidden state supported'
						);
					}
				}
			},

			_mergeConditions: function (
				conditionA,
				conditionB,
				skipConditionBOptionFamilyIfConflictsWithA
			) {
				var optionFamily;
				var optionValues;
				var optionValue;
				var targetOptionValues;

				for (optionFamily in conditionB) {
					optionValues = conditionB[optionFamily];
					targetOptionValues = conditionA[optionFamily];

					if (targetOptionValues && targetOptionValues.length) {
						//we will not merge optionvalues from inserted condition if there is condition in target optionfamility
						//it is because we may have external condition for GearboxType:Manual, and internal condition GearBoxType:Automatic
						//we have to take in account only condition from external block and do not take in account condition from pointer
						if (!skipConditionBOptionFamilyIfConflictsWithA) {
							for (optionValue in optionValues) {
								if (targetOptionValues.indexOf(optionValue) != -1) {
									targetOptionValues.push(optionValue);
								}
							}
						}
					} else {
						conditionA[optionFamily] = [].concat(optionValues);
					}
				}

				return conditionA;
			},

			GetElementCondition: function (targetElement, conditionType) {
				var elementUid = targetElement.Id();
				var haveExternalCondition = false;
				var condition = {};

				//use cache only in case when both internal and external should be requested
				if (!conditionType) {
					var cachedCondition = this._allConditions.get(elementUid);

					if (cachedCondition) {
						return cachedCondition;
					}
				}

				//merge condition from external element if explicitly selected or not defined
				//we have to pick condition from external element first because they have highest priority than
				//condition from pointer to the same external element
				//Example: External element has top-level  condition GearboxType:Manual
				//If pointer will have condition GearboxType:Automatic, then we will have situation in which element can be applicable
				//for both filter Manual and Automatic, which is wrong.
				if (
					targetElement.is('XmlSchemaExternalElement') &&
					(!conditionType || conditionType == Enums.ByReferenceType.External)
				) {
					var referenceCondition = JSON.parse(
						targetElement.ConditionExternal() || '{}'
					);

					this._mergeConditions(condition, referenceCondition, false);
					haveExternalCondition = true;
				}

				//merge condition from internal element or element pointer if explicitly selected or not defined
				if (!conditionType || conditionType == Enums.ByReferenceType.Internal) {
					var internalCondition = JSON.parse(targetElement.Condition());
					var skipConflicts = haveExternalCondition;
					//I know that this condition is overkill, but I want to have explicit initialization of skipConflicts flag
					//for better understanding in future, also it will not be clear if we will pass haveExternalCondition as a parameter for skipping

					condition = this._mergeConditions(
						condition,
						internalCondition,
						skipConflicts
					);
				}

				//cache value only when both internal and external was requested
				if (!conditionType) {
					this._allConditions.set(elementUid, condition);
				}

				return condition;
			},

			_recalculateElementDisplay: function (targetElement) {
				var condition = this.GetElementCondition(targetElement);

				if (this._executeCondition(condition, this._documentView)) {
					targetElement.Display(Enums.DisplayType.Active);
				} else {
					// if condition doesn't match value, then hide or deactivate element
					targetElement.Display(this.DisplayPreference());
				}
			},

			_recalculateDisplay: function () {
				var elementId;
				var element;

				this._viewmodel.SuspendInvalidation();

				for (elementId in this._all) {
					element = this._all[elementId];
					this._recalculateElementDisplay(element);
				}

				this._viewmodel.ResumeInvalidation();
			},

			trackConditionHandler: function (targetElement, stopTracking) {
				if (targetElement && targetElement.is('XmlSchemaElement')) {
					var elementUid = targetElement.Id();

					if (!stopTracking && targetElement.haveCondition()) {
						this._all[elementUid] = targetElement;
						this._allConditions.set(elementUid);
					} else if (this._all[elementUid]) {
						delete this._all[elementUid];
						this._allConditions.remove(elementUid);
					}

					if (!stopTracking) {
						this._recalculateElementDisplay(targetElement);
					}
				}
			},

			_executeCondition: function (condition, value) {
				var valueOptionFamily;
				var valueOptionValues;
				var valueOptionValueIndex;
				var valueOptionValue;
				var conditionOptionValues;
				var isOptionFamilyMatched;

				for (valueOptionFamily in value) {
					isOptionFamilyMatched = false;
					valueOptionValues = value[valueOptionFamily];
					conditionOptionValues = condition[valueOptionFamily];

					if (conditionOptionValues) {
						//do match for all optionValue from value with optionValue from condition, if one matches then OptionFamily is matched
						for (valueOptionValueIndex in valueOptionValues) {
							valueOptionValue = valueOptionValues[valueOptionValueIndex];

							if (conditionOptionValues.indexOf(valueOptionValue) != -1) {
								isOptionFamilyMatched = true;
								break;
							}
						}
					} else {
						//if value optionFamily doesn't have matched optionFamily in condition, then that optionFamily is marked as matched.
						isOptionFamilyMatched = true;
					}

					if (!isOptionFamilyMatched) {
						return false;
					}
				}

				return true;
			}
		}
	);
});
