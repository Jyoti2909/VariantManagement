function AmlValidator(aras) {
	this.aras = aras;

	this.types = {};

	// XmlDocument that contains xslt transformation applied for each aml before validation.
	this.xslt = null;

	this.schemaGlobalObjects = [];

	this.xslt = this.aras.createXMLDocument();
	this.xslt.loadXML(
		`<?xml version="1.0" encoding="UTF-8"?>
		<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
			<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
			<xsl:template match="/ | @* | node()">
				<xsl:choose>
					<xsl:when test="local-name() = 'OR'">
						<xsl:call-template name="OR"/>
					</xsl:when>
					<xsl:when test="local-name() = 'NOT'">
						<xsl:call-template name="NOT"/>
					</xsl:when>
					<xsl:when test="local-name() = 'Relationships'">
						<xsl:call-template name="TransformRelationships"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="doCopy"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:template>
			<xsl:template name="NOT">
				<xsl:element name="NOT">
					<xsl:for-each select="*">
						<xsl:choose>
							<xsl:when test="local-name() = 'OR'">
								<xsl:call-template name="OR"/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:call-template name="doCopy"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:for-each>
				</xsl:element>
			</xsl:template>
			<xsl:template name="OR">
				<xsl:variable name="firstNotORNode" select="*[local-name() != 'OR']"/>
				<xsl:choose>
					<!-- 
					If OR contains not OR nodes. 
					1) Find first not OR node.
					2) Rename current OR node to OR-firstNotORNodeName.
					3) Rename all nested OR nodes to OR-firstNotORNodeName.
					-->
					<xsl:when test="count($firstNotORNode) > 0">
						<xsl:call-template name="createNewOR">
							<xsl:with-param name="newORName" select="local-name($firstNotORNode[1])"/>
						</xsl:call-template>
					</xsl:when>
					<!-- 
					Otherwise:
					1) If OR has OR child nodes, find the deepest OR node having not OR node element.
					2) If found such OR, rename it and all it"s parent OR nodes.
					3) If such OR not found, just copy structure.
					-->
					<xsl:when test="count(*[local-name() != 'OR']) > 0">
						<xsl:call-template name="OR"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="doCopy"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:template>
			<xsl:template name="TransformRelationships">
				<xsl:element name="Relationships">
					<xsl:for-each select="*">
						<xsl:choose>
							<xsl:when test="local-name()='Item'">
								<xsl:call-template name="createNewItem">
									<xsl:with-param name="newItemName" select="translate(@type, ' ', '-')"/>
								</xsl:call-template>
							</xsl:when>
							<xsl:otherwise>
								<xsl:call-template name="doCopy"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:for-each>
				</xsl:element>
			</xsl:template>
			<xsl:template name="createNewItem">
				<xsl:param name="newItemName"/>
				<xsl:element name="Item-type-{$newItemName}-">
					<xsl:for-each select="@* | child::node()">
						<xsl:call-template name="doCopy"/>
					</xsl:for-each>
				</xsl:element>
			</xsl:template>
			<xsl:template name="createNewOR">
				<xsl:param name="newORName"/>
				<xsl:element name="OR-{$newORName}">
					<xsl:for-each select="child::node()">
					<xsl:choose>
							<xsl:when test="local-name(.) = 'OR'">
								<xsl:call-template name="createNewOR">
									<xsl:with-param name="newORName" select="$newORName"/>
								</xsl:call-template>
							</xsl:when>
							<xsl:otherwise>
								<xsl:call-template name="doCopy"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:for-each>
				</xsl:element>
			</xsl:template>
			<xsl:template name="doCopy">
				<xsl:copy>
					<xsl:apply-templates select="@* | node()"/>
				</xsl:copy>
			</xsl:template>
		</xsl:stylesheet>`
	);

	this._transformAmlBeforeValidation = function (amlToValidate) {
		const xd = this.aras.createXMLDocument();
		xd.validateOnParse = true;

		xd.loadXML(amlToValidate);
		xd.loadXML(xd.transformNode(this.xslt));
		return xd.xml;
	};

	this._transformXPath = function (XPath) {
		return XPath.replace(/\W/g, '-').replace(/[-]{2,}/g, '-');
	};

	this._getTypeOfLastItemInXPath = function (XPath) {
		// <summary>
		// Gets type of last Item in the XPath.
		// </summary>
		// <param name="XPath" type="string">Any XPath. Expected xpath like Item[@type="A"]/prop_item/Item[@type="B"]</param>
		// <returns type="string">Type of last Item in the XPath or null.</returns>
		let res = /[@type=[''|""]([\w| ]*)[''|""]]$/.exec(XPath);
		if (res !== null) {
			res = res[1];
		}

		return res;
	};

	this._generatePropertyOR = function (orName, propName, propDT) {
		return `<xs:complexType name="${orName}">
				<xs:choice maxOccurs="unbounded">
					${this._generatePropertyDefinition(propName, propDT)}
					<xs:element name="OR-${propName}" type="${orName}"/>
				</xs:choice>
			</xs:complexType>`;
	};

	this._generatePropertyDefinition = function (propName, propDT) {
		return `<xs:element name="${propName}" type="CONST-${propDT.replace(
			' ',
			'-'
		)}"/>`;
	};
}

AmlValidator.prototype.getRootItemXPath = function AmlValidatorGetRootItemXPath() {
	const validationXPath = Object.keys(this.validationInfoObject)[0];
	return validationXPath ? validationXPath.split('/')[0] : '';
};

AmlValidator.prototype.validate = function AmlValidatorValidate(
	amlToValidate,
	xmlSchemaCache
) {
	// <summary>
	// Performs run-time validation on the aml  using the XMLSchemaCache object.
	// </summary>
	// <param name="amlToValidate" type="string">Any XPath. Expected xpath like Item[@type="A"]/prop_item/Item[@type="B"]</param>
	// <param name="xmlSchemaCache" type="Object">XMLSchemaCache object containing validation schema.</param>
	// <returns type="string">Returns empty string if validation passed successfully. Otherwise returns error message string.</returns>
	if (!amlToValidate || !xmlSchemaCache) {
		return '';
	}
	const schemas = [];
	schemas.push({ namespace: '', xml: xmlSchemaCache });
	// eslint-disable-next-line new-cap
	const res = this.aras.ValidateXml(
		schemas,
		this._transformAmlBeforeValidation(amlToValidate)
	);
	const isValid = res.selectSingleNode('Result/isvalid').text == 'true';
	if (!isValid) {
		// validation failed
		return false;
	} else {
		// validation passed
		return true;
	}
};

AmlValidator.prototype.generateItemDefinition = function AmlValidatorGenerateItemDefinition(
	parentItemXPath,
	isRoot,
	withKeyedName
) {
	if (!parentItemXPath) {
		return '';
	}

	const typeOfItem = this._getTypeOfLastItemInXPath(parentItemXPath);

	let newItemTagName = 'Item';
	const parentItemXPathSplitted = parentItemXPath.split('/');
	if (
		parentItemXPathSplitted.length > 2 &&
		'Relationships' ==
			parentItemXPathSplitted[parentItemXPathSplitted.length - 2]
	) {
		newItemTagName = this._transformXPath(
			parentItemXPathSplitted[parentItemXPathSplitted.length - 1]
		);
	}

	const itemDefinition = [];
	itemDefinition.push(
		`<xs:element name="${newItemTagName}">
			<xs:complexType>`
	);

	this.generateInnerItemDefinition(
		parentItemXPath,
		itemDefinition,
		withKeyedName
	);
	this.generateItemAttributesDefinition(typeOfItem, itemDefinition, isRoot);

	itemDefinition.push(
		`	</xs:complexType>
		</xs:element>`
	);

	return itemDefinition.join('');
};

AmlValidator.prototype.generateDefinitionForNotGroup = function AmlValidatorGenerateDefinitionForNotGroup(
	parentItemXPath,
	parentItemDef,
	withKeyedName
) {
	const transformedParentItemXPath = this._transformXPath(parentItemXPath);

	const orGroupName = 'OR-Group-' + transformedParentItemXPath;
	const nameOfNotDefinition = 'NOT-' + transformedParentItemXPath;

	const groupDefinition = [];
	groupDefinition.push(
		`<xs:complexType name="${nameOfNotDefinition}">
			<xs:choice maxOccurs="unbounded">
				<xs:group ref="${orGroupName}" maxOccurs="unbounded"/>`
	);

	if (withKeyedName) {
		groupDefinition.push(
			'    <xs:element name="keyed_name" type="CONST-string"/>'
		);
	}

	const parentItemXPathDeep = parentItemXPath.split('/').length;

	for (const currentXPath in this.validationInfoObject) {
		if (currentXPath.indexOf(parentItemXPath) == -1) {
			continue;
		}

		const currentXPathArray = currentXPath.split('/');
		const currentXPathDeep = currentXPathArray.length;
		if (currentXPathDeep == parentItemXPathDeep + 1) {
			const propDef = this.validationInfoObject[currentXPath];
			const realPropDef = this.aras.getRealPropertyForForeignProperty(propDef);
			const propDataType = this.aras.getItemProperty(realPropDef, 'data_type');
			const propName = this.aras.getItemProperty(propDef, 'name');

			if ('item' != propDataType) {
				groupDefinition.push(
					this._generatePropertyDefinition(propName, propDataType)
				);
			}
		}
	}

	groupDefinition.push(
		`	</xs:choice>
		</xs:complexType>`
	);

	this.schemaGlobalObjects.push(groupDefinition.join(''));

	return nameOfNotDefinition;
};

AmlValidator.prototype.generateItemPropertyDefinition = function AmlValidatorGenerateItemPropertyDefinition(
	propertyXPath,
	propName
) {
	const itemPropertyArray = [];
	itemPropertyArray.push(
		`<xs:element name="${propName}">
			<xs:complexType>
				<xs:choice minOccurs="0" maxOccurs="unbounded">`
	);

	for (const currentXPath in this.validationInfoObject) {
		if (currentXPath.indexOf(propertyXPath) == -1) {
			continue;
		}

		let newItemXPath = '';
		let withKeyedName = false;

		if (currentXPath == propertyXPath) {
			const propDef = this.validationInfoObject[currentXPath];
			const realPropertyDef = this.aras.getRealPropertyForForeignProperty(
				propDef
			);
			const propertyDataSource = this.aras.getItemPropertyAttribute(
				realPropertyDef,
				'data_source',
				'name'
			);
			let typeCriterion = '';
			if (propertyDataSource) {
				typeCriterion = "[@type='" + propertyDataSource + "']";
			}

			newItemXPath = currentXPath + '/Item' + typeCriterion;
			if (!this.validationInfoObject[newItemXPath + '/keyed_name']) {
				withKeyedName = true;
			}
		} else {
			const currentXPathArray = currentXPath.split('/');
			const propertyXPathDeep = propertyXPath.split('/').length;

			const newItemXPathArray = [];
			for (let j = 0; j < propertyXPathDeep; j++) {
				newItemXPathArray.push(currentXPathArray[j]);
			}

			newItemXPath = newItemXPathArray.join('/');
			// Exclude situation when
			// currentXPath = "Item[@type="InBasket Task"]/container_type_id" and
			// propertyXPath = "Item[@type="InBasket Task"]/container"
			if (newItemXPath.length > 0 && newItemXPath != propertyXPath) {
				continue;
			}

			newItemXPath += '/' + currentXPathArray[propertyXPathDeep];

			withKeyedName = false;
			if (
				this.validationInfoObject[newItemXPath] &&
				!this.validationInfoObject[newItemXPath + '/keyed_name']
			) {
				withKeyedName = true;
				this.aras.deletePropertyFromObject(
					this.validationInfoObject,
					newItemXPath
				);
			}
		}

		itemPropertyArray.push(
			this.generateItemDefinition(newItemXPath, false, withKeyedName)
		);
	}
	itemPropertyArray.push(
		`		</xs:choice>
				<xs:attribute name="condition" type="${this.types.item}" use="optional"/>
			</xs:complexType>
		</xs:element>`
	);
	return itemPropertyArray.join('');
};

AmlValidator.prototype.generateDefenitionForCurrentState = function AmlValidatorGenerateDefenitionForCurrentState(
	preffix
) {
	const currentPropDefention = `
		<xs:complexType name="AND-label-and-name__${preffix}">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="label" type="CONST-null-label"/>
				<xs:element name="name" type="CONST-string"/>
			</xs:choice>
		</xs:complexType>
		<xs:complexType name="OR-label-and__${preffix}">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="label" type="CONST-string"/>
				<xs:element name="AND" type="AND-label-and-name__${preffix}"/>
			</xs:choice>
		</xs:complexType>
		<xs:complexType name="OR-label__${preffix}">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="label" type="CONST-string"/>
			</xs:choice>
		</xs:complexType>
		<xs:complexType name="AND-nulllabel__${preffix}">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="label" type="CONST-null-label"/>
				<xs:element name="OR-name" type="CONST-OR-name"/>
			</xs:choice>
		</xs:complexType>
		<xs:complexType name="curr__${preffix}">
			<xs:choice maxOccurs="unbounded">
				<xs:group ref="current_state-Group__${preffix}" maxOccurs="unbounded"/>
			</xs:choice>
		</xs:complexType>
		<xs:group name="current_state-Group__${preffix}">
			<xs:choice>
				<xs:element name="OR-AND" type="curr__${preffix}"/>
				<xs:element name="AND" type="AND-nulllabel__${preffix}"/>
				<xs:element name="label" type="CONST-string"/>
				<xs:element name="OR-label" type="OR-label__${preffix}"/>
			</xs:choice>
		</xs:group>
	`;
	this.schemaGlobalObjects.push(currentPropDefention);
};

AmlValidator.prototype.generateInnerItemDefinition = function AmlValidatorGenerateInnerItemDefinition(
	parentItemXPath,
	parentItemDef,
	withKeyedName
) {
	const transformedParentItemXPath = this._transformXPath(parentItemXPath);
	const isCurrentState = parentItemXPath.endsWith(
		"current_state/Item[@type='Life Cycle State']"
	);
	if (isCurrentState) {
		this.generateDefenitionForCurrentState(transformedParentItemXPath);
	}

	const orName = 'OR-' + transformedParentItemXPath;
	const orGroupName = 'OR-Group-' + transformedParentItemXPath;

	const notName = this.generateDefinitionForNotGroup(
		parentItemXPath,
		parentItemDef,
		withKeyedName
	);

	this.schemaGlobalObjects.push(
		`<xs:complexType name="${orName}">
			<xs:choice maxOccurs="unbounded">
				<xs:group ref="${orGroupName}" maxOccurs="unbounded"/>
			</xs:choice>
		</xs:complexType>`
	);

	const orGroupDefinition = [];
	orGroupDefinition.push(
		`<xs:group name="${orGroupName}">
			<xs:choice>
				<xs:element name="OR" type="${orName}"/>
				<xs:element name="NOT" type="${notName}"/>`
	);

	const parentItemXPathDeep = parentItemXPath.split('/').length;

	parentItemDef.push('      <xs:choice minOccurs="0" maxOccurs="unbounded">');

	if (withKeyedName) {
		if (isCurrentState) {
			parentItemDef.push(`
				<xs:element name="OR-AND" type="curr__${transformedParentItemXPath}"/>
				<xs:element name="OR-label" type="OR-label-and__${transformedParentItemXPath}"/>
			`);
		} else {
			parentItemDef.push(`
				<xs:element name="keyed_name" type="CONST-string"/>
			`);
			orGroupDefinition.push(`
				<xs:element name="OR-keyed_name" type="CONST-OR-keyed_name"/>
			`);
		}
	}

	for (const currentXPath in this.validationInfoObject) {
		if (currentXPath.indexOf(parentItemXPath) == -1) {
			continue;
		}

		let propName;
		const currentXPathArray = currentXPath.split('/');
		const currentXPathDeep = currentXPathArray.length;
		if (currentXPathDeep == parentItemXPathDeep + 1) {
			const propDef = this.validationInfoObject[currentXPath];
			const realPropDef = this.aras.getRealPropertyForForeignProperty(propDef);
			const propDT = this.aras.getItemProperty(realPropDef, 'data_type');
			propName = this.aras.getItemProperty(propDef, 'name');

			if ('item' != propDT) {
				const orTypeName = 'OR-' + transformedParentItemXPath + propName;

				parentItemDef.push(this._generatePropertyDefinition(propName, propDT));
				orGroupDefinition.push(
					'<xs:element name="OR-' + propName + '" type="' + orTypeName + '"/>'
				);

				this.schemaGlobalObjects.push(
					this._generatePropertyOR(orTypeName, propName, propDT)
				);
			} else {
				parentItemDef.push(
					this.generateItemPropertyDefinition(
						parentItemXPath + '/' + propName,
						propName
					)
				);
			}
		} else {
			propName = currentXPathArray[parentItemXPathDeep];
			parentItemDef.push(
				this.generateItemPropertyDefinition(
					parentItemXPath + '/' + propName,
					propName
				)
			);
		}

		this.aras.deletePropertyFromObject(this.validationInfoObject, currentXPath);
	}

	orGroupDefinition.push(
		`	</xs:choice>
		</xs:group>`
	);

	this.schemaGlobalObjects.push(orGroupDefinition.join(''));

	parentItemDef.push(
		`<xs:group ref="${orGroupName}"/>
	</xs:choice>`
	);
};

AmlValidator.prototype.generateConditionDefinition = function AmlValidatorGenerateConditionDefinition(
	conditionNum,
	allowedValuesArr
) {
	const conditionDefinitions = [];
	conditionDefinitions.push(
		`<xs:simpleType name="CONST-Condition-${conditionNum}">
			<xs:restriction base="xs:string">`
	);

	for (let i = 0; i < allowedValuesArr.length; i++) {
		conditionDefinitions.push(
			`	<xs:enumeration value="${allowedValuesArr[i]}"/>`
		);
	}

	conditionDefinitions.push(
		`	</xs:restriction>
		</xs:simpleType>`
	);
	return conditionDefinitions.join('');
};

AmlValidator.prototype.generateItemAttributesDefinition = function AmlValidatorGenerateItemAttributesDefinition(
	typeOfItem,
	itemDefinition,
	isRoot
) {
	const ifLifeCycleState = typeOfItem === 'Life Cycle State';
	const actionTagRequirements =
		ifLifeCycleState && !isRoot ? `prohibited` : `required`;

	itemDefinition.push(
		`<xs:attribute name="action" type="action-attribute" use="${actionTagRequirements}"/>`
	);

	if (typeOfItem) {
		itemDefinition.push(
			`<xs:attribute name="type" use="required">
				<xs:simpleType>
						<xs:restriction base="xs:string">
							<xs:enumeration value="${typeOfItem}"/>
						</xs:restriction>
				</xs:simpleType>
			</xs:attribute>`
		);
	}

	if (isRoot) {
		itemDefinition.push(
			`<xs:attribute name="typeId" use="optional">
				<xs:simpleType>
					<xs:restriction base="xs:string">
						<xs:length value="32"/>
					</xs:restriction>
				</xs:simpleType>
			</xs:attribute>
			<xs:attribute name="page" type="integer-as-string" use="optional" />
			<xs:attribute name="pagesize" type="integer-as-string" use="optional" />
			<xs:attribute name="maxRecords" type="integer-as-string" use="optional" />
			<xs:attribute name="returnMode" type="xs:string" use="optional" />
			<xs:attribute name="select" type="xs:string" use="optional"/>
			<xs:attribute name="queryType" type="xs:string" use="optional"/>
			<xs:attribute name="queryDate" type="xs:string" use="optional"/>`
		);

		if (this.aras.getVariable('SortPages') == 'true') {
			itemDefinition.push(
				'      <xs:attribute name="order_by" type="xs:string" use="optional"/>'
			);
		}
	}
};

AmlValidator.prototype.generateConditions = function AmlValidatorGenerateConditions() {
	let res = '';
	res += this.generateConditionDefinition(0, ['eq', 'ne']);
	res += this.generateConditionDefinition(1, ['is null', 'is not null']);
	res += this.generateConditionDefinition(2, [
		'eq',
		'ne',
		'is null',
		'is not null'
	]);
	res += this.generateConditionDefinition(3, [
		'eq',
		'ne',
		'like',
		'not like',
		'is null',
		'is not null'
	]);
	res += this.generateConditionDefinition(4, [
		'eq',
		'ne',
		'lt',
		'gt',
		'le',
		'ge',
		'is null',
		'is not null'
	]);
	res += this.generateConditionDefinition(5, [
		'eq',
		'ne',
		'lt',
		'gt',
		'le',
		'ge',
		'is null',
		'is not null',
		'between',
		'not between'
	]);
	res += this.generateConditionDefinition(6, ['is null']);

	return res;
};

AmlValidator.prototype.generateTypeDefinition = function AmlValidatorGenerateTypeDefinition(
	innovatorTypesArr,
	typeName,
	conditionType,
	baseTypeName
) {
	this.types[typeName] = conditionType;
	if ('integer' == typeName && !baseTypeName) {
		baseTypeName = 'integer-or-empty-string';
		innovatorTypesArr.push(
			`<xs:simpleType name="${baseTypeName}">
				<xs:restriction base="xs:string">
					<xs:pattern value="([-+]?[0-9]+)?"/>
				</xs:restriction>
			</xs:simpleType>`
		);
	}

	if (!baseTypeName) {
		baseTypeName = 'xs:string';
	}

	innovatorTypesArr.push(
		`<xs:complexType name="CONST-${typeName}">
			<xs:simpleContent>
				<xs:extension base="${baseTypeName}">
					<xs:attribute name="condition" type="${conditionType}"/>
				</xs:extension>
			</xs:simpleContent>
		</xs:complexType>`
	);
};

AmlValidator.prototype.generateTypes = function AmlValidatorGenerateTypes() {
	const typesArray = [];
	this.generateTypeDefinition(
		typesArray,
		'boolean',
		'CONST-Condition-0',
		'xs:boolean'
	);
	this.generateTypeDefinition(typesArray, 'color', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'color-list', 'CONST-Condition-2');
	this.generateTypeDefinition(typesArray, 'date', 'CONST-Condition-5');
	this.generateTypeDefinition(
		typesArray,
		'decimal',
		'CONST-Condition-4',
		'xs:decimal'
	);
	this.generateTypeDefinition(typesArray, 'federated', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'filter-list', 'CONST-Condition-2');
	this.generateTypeDefinition(
		typesArray,
		'float',
		'CONST-Condition-4',
		'xs:float'
	);
	this.generateTypeDefinition(
		typesArray,
		'formatted-text',
		'CONST-Condition-3'
	);
	this.generateTypeDefinition(typesArray, 'image', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'integer', 'CONST-Condition-4');
	this.generateTypeDefinition(typesArray, 'item', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'list', 'CONST-Condition-2');
	this.generateTypeDefinition(typesArray, 'md5', 'CONST-Condition-2');
	this.generateTypeDefinition(typesArray, 'ml_string', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'mv_list', 'CONST-Condition-4');
	this.generateTypeDefinition(typesArray, 'sequence', 'CONST-Condition-4');
	this.generateTypeDefinition(typesArray, 'string', 'CONST-Condition-3');
	this.generateTypeDefinition(typesArray, 'text', 'CONST-Condition-3');
	this.generateTypeDefinition(
		typesArray,
		'global_version',
		'CONST-Condition-5',
		'unsigned-big-integer-or-empty-string'
	);
	this.generateTypeDefinition(
		typesArray,
		'ubigint',
		'CONST-Condition-5',
		'unsigned-big-integer-or-empty-string'
	);

	this.generateTypeDefinition(typesArray, 'null-label', 'CONST-Condition-6');

	return typesArray.join('');
};

AmlValidator.prototype.generateSchema = function AmlValidatorGenerateSchema(
	validationInfoObject
) {
	this.validationInfoObject = validationInfoObject;

	this.schemaGlobalObjects = [];
	this.schemaGlobalObjects.push(
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
			<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">`
	);
	this.schemaGlobalObjects.push(this.generateTypes());
	this.schemaGlobalObjects.push(this.generateConditions());
	this.schemaGlobalObjects.push(
		this.generateItemDefinition(this.getRootItemXPath(), true, false)
	);
	this.schemaGlobalObjects.push(
		`<xs:complexType name="CONST-OR-keyed_name">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="keyed_name" type="CONST-string"/>
				<xs:element name="OR-keyed_name" type="CONST-OR-keyed_name"/>
			</xs:choice>
		</xs:complexType>
		<xs:complexType name="CONST-OR-name">
			<xs:choice maxOccurs="unbounded">
				<xs:element name="name" type="CONST-string"/>
				<xs:element name="OR-name" type="CONST-OR-name"/>
			</xs:choice>
		</xs:complexType>
		<xs:simpleType name="integer-as-string">
			<xs:restriction base="xs:string">
				<xs:pattern value="|\\d*"/>
			</xs:restriction>
		</xs:simpleType>
		<xs:simpleType name="unsigned-big-integer-or-empty-string">
			<xs:restriction base="xs:string">
				<xs:pattern value="([0-9]){0,20}"/>
			</xs:restriction>
		</xs:simpleType>
		<xs:simpleType name="action-attribute">
			<xs:restriction base="xs:string">
				<xs:enumeration value="get"/>
			</xs:restriction>
		</xs:simpleType>
	</xs:schema>`
	);

	return this.schemaGlobalObjects.join('');
};
// eslint-disable-next-line spaced-comment
/*@cc_on
@if (@register_classes == 1)
Type.registerNamespace("Aras");
Type.registerNamespace("Aras.Client");
Type.registerNamespace("Aras.Client.JS");

Aras.Client.JS.AmlValidator = AmlValidator;
Aras.Client.JS.AmlValidator.registerClass("Aras.Client.JS.AmlValidator");
@end
@*/
