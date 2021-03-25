define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElementRenderer, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasItemPropertyXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			constructor: function (initialArguments) {},

			prepareElementState: function (schemaElement, parentState) {
				const resultState = this.inherited(arguments);

				if (schemaElement) {
					resultState.isEditable = schemaElement.isEditable();
					resultState.isPropertyModified = schemaElement.isPropertyModified();
					resultState.hasSourceItem = Boolean(schemaElement.getSourceItem());
					resultState.propertyDataType = schemaElement.getPropertyInfo(
						'data_type'
					);
				}

				return resultState;
			},

			getStateClasses: function (schemaElement, elementState) {
				const stateClasses = this.inherited(arguments);

				stateClasses.push(
					elementState.isEditable ? 'WritableProperty' : 'ReadonlyProperty'
				);

				if (!elementState.hasSourceItem) {
					stateClasses.push('SourcelessProperty');
				}

				if (elementState.propertyDataType) {
					stateClasses.push(elementState.propertyDataType + 'DataType');
				}

				return stateClasses;
			},

			GetTreeName: function (schemaElement, elementState) {
				let treeName = this.inherited(arguments);
				const propertyName = schemaElement.getPropertyName();

				if (propertyName) {
					const schemaHelper = schemaElement.ownerDocument.Schema();
					const propertyAttribute = schemaHelper.getSchemaAttribute(
						schemaElement,
						'property'
					);

					if (
						!propertyAttribute.Fixed &&
						propertyAttribute.Default !== propertyName
					) {
						const propertyLabel =
							schemaElement.getPropertyInfo('label') || propertyName;
						treeName += ' - ' + propertyLabel;
					}
				}

				return treeName;
			},

			RenderInnerElement: function (schemaElement, elementState) {
				let propertyValue = schemaElement.getPropertyValue();
				let outputHtml = '';

				if (propertyValue) {
					const textHighlightning = schemaElement.getTextHighlightning();
					const highlightRanges = textHighlightning.getAllRanges();
					const propertyType = elementState.propertyDataType;

					switch (propertyType) {
						case 'image':
							if (propertyValue) {
								if (
									propertyValue.toLowerCase().indexOf('vault:///?fileid=') !==
									-1
								) {
									const fileId = propertyValue.substr(
										propertyValue.length - 32
									);
									propertyValue = this._aras.IomInnovator.getFileUrl(
										fileId,
										this._aras.Enums.UrlType.SecurityToken
									);
								} else {
									propertyValue = this._aras.getScriptsURL() + propertyValue;
								}
							}

							outputHtml = this.wrapInTag('', 'img', {
								class: '',
								src: propertyValue
							});
							break;
						case 'boolean':
							outputHtml = propertyValue === '1' ? 'true' : 'false';
							break;
						case 'date':
						case 'integer':
						case 'float':
						case 'decimal':
							outputHtml = schemaElement.getPropertyLocalValue();
							break;
						default:
							outputHtml = propertyValue;
							break;
					}

					if (highlightRanges.length) {
						let textPosition = 0;
						let highlightedOutput = '';

						for (let i = 0; i < highlightRanges.length; i++) {
							currentRange = highlightRanges[i];
							startPosition = Math.max(0, currentRange.start);
							endPosition = Math.min(outputHtml.length, currentRange.end);

							highlightedOutput += outputHtml.substring(
								textPosition,
								startPosition
							);
							highlightedOutput += this.wrapInTag(
								outputHtml.substring(startPosition, endPosition),
								'hlr',
								{ rangeId: currentRange.id }
							);

							textPosition = endPosition;
						}

						highlightedOutput += outputHtml.substring(
							endPosition,
							outputHtml.length
						);
						outputHtml = highlightedOutput;
					}
				}

				return outputHtml;
			},

			getStatusMarksContent: function (schemaElement, elementState) {
				if (schemaElement) {
					let marksContent = '';
					let markCount = 0;

					if (elementState && elementState.isBlocked) {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/Blocked.svg',
							class: 'ConditionMark'
						});
						markCount++;
					}

					if (schemaElement.Condition() !== '{}') {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/ConditionsApplied.svg',
							class: 'ConditionMark',
							style: markCount ? 'right:' + markCount * 20 + 'px;' : undefined
						});
						markCount++;
					}

					if (elementState.isPropertyModified) {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/Edit.svg',
							class: 'ConditionMark ItemModifiedMark',
							style: markCount ? 'right:' + markCount * 20 + 'px;' : undefined
						});
						markCount++;
					}

					return marksContent;
				}
			}
		}
	);
});
