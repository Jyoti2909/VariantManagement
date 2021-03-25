/* global define */
define('Modules/aras.innovator.VariantManagementSample/Scripts/usageConditions/usageConditionDataLoader', [
'dojo/_base/declare'
],
function (declare) {
    return declare(null, {
        aras: null,
        builderMethodName: null,

        constructor: function (initialParameters) {
            this.aras = initialParameters.aras;
            this.builderMethodName = initialParameters.builderMethodName;

        },

        getValidCombinations: function (scopeId, sourceID, dialogsUsageConditions, fetchSize) {
            let requestItem = this.aras.newIOMItem('Method', 'cfg_GetValidCombinations');
            let targetScope = aras.newIOMItem('cfg_Scope', 'vm_scopeBuilder');
            let selectAttribute = '';
            let conditionAttribute = '';
            let conditionXmlDocument;
            const usageConditionSourceItems = this.getUsageConditionSourceItems(sourceID);
            const assets = this.getAssetsArray(usageConditionSourceItems);

            for (let i = 0; i < assets.length; i++) {
                let expression;
                if (!assets[i].usages) {
                    continue;
                }

                for (let j = 0; j < assets[i].usages.length; j++) {
                    let usageConditionDefinition = assets[i].usages[j].definition;
                    const expressionTag = "<expression>";
                    const startIndex = usageConditionDefinition.search(expressionTag);
                    const endIndex = usageConditionDefinition.search("</expression>");
                    expression = usageConditionDefinition.substring(startIndex + expressionTag.length, endIndex);
                }

                if (expression) {
                    conditionAttribute += '<NOT>' + expression + '</NOT>';
                }
            }

            if (dialogsUsageConditions) {
                conditionAttribute += '<AND>' + dialogsUsageConditions + '</AND>';
            }

            requestItem.setID(scopeId);
            requestItem.setAttribute('dataSource', 'db');
            requestItem.setAttribute('select', selectAttribute);
            requestItem.setAttribute('fetch', fetchSize);

            // create and append condition property node
            if (conditionAttribute) {
                conditionXmlDocument = new XmlDocument();
                conditionXmlDocument.loadXML('<condition><![CDATA[<expression><AND>' + conditionAttribute + '</AND></expression>]]></condition>');
                requestItem.node.appendChild(requestItem.node.ownerDocument.importNode(conditionXmlDocument.documentElement, true));
            }

            targetScope.setID(scopeId);

            requestItem.setPropertyItem('targetScope', targetScope);
            requestItem = requestItem.apply();

            if (requestItem.isError()) {
                this.aras.AlertError(requestItem);
            } else {
                return this.parseCombinationsResponce(requestItem.getResult());
            }
        },

        parseCombinationsResponce: function (responceText) {
            //'{}' response means there are no valid combinations
            //There is the known issue IR-056764 in the Configurator Services APIs, when the 'cfg_GetValidCombinations' method returns
            //wrong results for Scope objects with no Rules / Variables
            if ('{}' === responceText || -1 !== responceText.indexOf('#values#')) {
                return [];
            }

            let responceData = JSON.parse(responceText);
            let combinationsMeta = responceData['combinations-meta'];
            let groupOrderedIdList = [Object.keys(combinationsMeta.variables).length];
            let combinationValueList = combinationsMeta.values;
            let variablesList = Object.keys(combinationsMeta.variables);
            let combinationsList = responceData.combinations;
            let currentCombination;
            let combinationItem;
            let normalizedCombination;
            let itemId;
            let groupId;

            for (groupId in combinationsMeta) {
                groupOrderedIdList[combinationsMeta[groupId]] = groupId;
            }

            for (let i = 0; i < combinationsList.length; i++) {
                currentCombination = combinationsList[i];
                normalizedCombination = [];

                for (let j = 0; j < currentCombination.length; j++) {
                    combinationItem = combinationValueList[currentCombination[j]];
                    itemId = this.normalizeCombinationItem(combinationItem);

                    normalizedCombination.push({
                        itemId: itemId,
                        variableId: variablesList[j],
                        getKey: function () {
                            return this.itemId + this.variableId;
                        }
                    });
                }

                combinationsList[i] = normalizedCombination;
            }

            return combinationsList;
        },

        getFeaturesArray: function (variabilityItemId) {
            let features = [];

            const scopeItem = this.getScopeStructureItem(variabilityItemId);
            if (scopeItem.isError()) {
                this._aras.AlertError(scopeItem);
                return [];
            }

            features = this.parseScopeItemToFeaturesArray(scopeItem);
            return features;
        },

        getScopeStructureItem: function (itemId) {
            const targetScopeItem = this.buildTargetScopeItem(itemId);

            const scopeItem = window.aras.newIOMItem('Method', 'cfg_GetScopeStructure');
            scopeItem.setPropertyItem('targetScope', targetScopeItem);
            return scopeItem.apply();
        },

        buildTargetScopeItem: function (itemId) {
            const targetScopeItem = window.aras.newIOMItem('Method', 'vm_scopeBuilder');
            targetScopeItem.setID(itemId);

            return targetScopeItem;
        },

        getUsageConditionSourceItems: function (scopeId) {
            const usageConditionSourceItems = this.aras.newIOMItem('vm_VariableComponentAsset ', 'get');
            usageConditionSourceItems.setProperty('source_id', scopeId);
            usageConditionSourceItems.setAttribute('select', 'related_id(keyed_name)');

            const usageConditionItem = usageConditionSourceItems.createRelationship('vm_VarComponentAssetUsage', 'get');
            usageConditionItem.setAttribute('select', 'definition');

            const usageConditionVariabilityItemRelationshipItem = usageConditionItem.createRelationship('vm_VarComponentAssetUsageVarIt', 'get');
            usageConditionVariabilityItemRelationshipItem.setAttribute('select', 'id');

            return usageConditionSourceItems.apply();
        },

        getAssetsArray: function (usageConditionSourceItems) {
            const assets = [];

            const usageConditionSourceItemCount = usageConditionSourceItems.getItemCount();
            for (let i = 0; i < usageConditionSourceItemCount; i++) {
                const usageConditionSourceItem = usageConditionSourceItems.getItemByIndex(i);

                const usages = [];
                const usageConditionInfo = {};

                const usageConditionItems = usageConditionSourceItem.getRelationships();
                const usageConditionItemCount = usageConditionItems.getItemCount();

                for (let j = 0; j < usageConditionItemCount; j++) {
                    const usageConditionItem = usageConditionItems.getItemByIndex(j);
                    const usageConditionItemId = usageConditionItem.getId();

                    if (usageConditionItemCount === 1) {
                        const relatedVariabilityItems = usageConditionItem.getRelationships('vm_VarComponentAssetUsageVarIt');
                        const usageConditionVariabilityItemRelationshipItemId = relatedVariabilityItems.getItemCount() === 1 ?
                            relatedVariabilityItems.getItemByIndex(0).getId() : aras.generateNewGUID();

                        usageConditionInfo.usageConditionVariabilityItemRelationshipItemId = usageConditionVariabilityItemRelationshipItemId;
                        usageConditionInfo.usageConditionItemId = usageConditionItemId;
                    }

                    usages.push({
                        id: usageConditionItemId,
                        definition: usageConditionItem.getProperty('definition')
                    });
                }

                if (usages.length === 0) {
                    usageConditionInfo.usageConditionItemId = this.aras.generateNewGUID();
                    usageConditionInfo.usageConditionVariabilityItemRelationshipItemId = this.aras.generateNewGUID();
                }

                const assetItem = usageConditionSourceItem.getRelatedItem();
                const usageConditionSourceItemId = usageConditionSourceItem.getId();

                assets.push({
                    rowId: usageConditionSourceItemId,
                    itemTypeName: assetItem ? assetItem.getType() : null,
                    keyedName: assetItem ? assetItem.getProperty('keyed_name') : '',
                    usages: usages
                });
            }

            return assets;
        },

        parseScopeItemToFeaturesArray: function (scopeItem) {
            const features = [];

            const variableItems = scopeItem.getRelationships('Variable');
            const variableCount = variableItems.getItemCount();

            for (let variableIndex = 0; variableIndex < variableCount; variableIndex++) {
                const variableItem = variableItems.getItemByIndex(variableIndex);
                const variableId = variableItem.getID();
                const variableName = variableItem.getProperty('name');

                const namedConstantIds = [];
                const namedConstantNames = [];

                const namedConstantItems = variableItem.getRelationships('NamedConstant');
                const namedConstantCount = namedConstantItems.getItemCount();

                for (let namedConstantIndex = 0; namedConstantIndex < namedConstantCount; namedConstantIndex++) {
                    const namedConstantItem = namedConstantItems.getItemByIndex(namedConstantIndex);
                    const namedConstantId = namedConstantItem.getID();
                    const namedConstantName = namedConstantItem.getProperty('name');

                    namedConstantIds.push(namedConstantId);
                    namedConstantNames.push(namedConstantName);
                }

                if (namedConstantNames.length) {
                    features.push({
                        id: variableId,
                        name: variableName,
                        optionIds: namedConstantIds,
                        optionNames: namedConstantNames
                    });
                }
            }

            return features;
        },

        normalizeCombinationItem: function (combinationItem) {
            if (combinationItem) {
                switch (combinationItem.type) {
                    case 'NamedConstant':
                        return combinationItem.id;
                }
            }
        },

        getSelectedVariableNamedConstantPairs: function (groupsList) {
            let resultList = [];
            let groupDescriptor;
            let childItems;

            for (let i = 0; i < groupsList.length; i++) {
                groupDescriptor = groupsList[i];

                if (groupDescriptor.selected) {
                    childItems = groupDescriptor.children;

                    for (let j = 0; j < childItems.length; j++) {
                        if (childItems[j].selected) {
                            let idList = childItems[j].idPath.split(',');
                            resultList.push({
                                namedConstantId: childItems[j].itemId,
                                variableId: idList[idList.length - 2]
                            });
                        }
                    }
                }
            }

            return resultList;
        },

        getDialogUsageConditions: function (variableNamedConstantPairs) {
            let groupItemsIdHash = {};
            let selectAttribute = '';
            let conditionAttribute = '';
            let childrenIdHash;
            let itemData;
            let idList;

            for (let i = 0; i < variableNamedConstantPairs.length; i++) {
                itemData = variableNamedConstantPairs[i];
                const sourceItemId = itemData.variableId;
                childrenIdHash = groupItemsIdHash[sourceItemId] || (groupItemsIdHash[sourceItemId] = []);

                childrenIdHash.push(itemData.namedConstantId);
            }

            for (let sourceItemId in groupItemsIdHash) {
                selectAttribute += (selectAttribute ? ',' : '') + sourceItemId;
                idList = groupItemsIdHash[sourceItemId];

                conditionAttribute += '<OR>';

                for (let i = 0; i < idList.length; i++) {
                    conditionAttribute +=
                        '<eq>' +
                        '<variable id="' + sourceItemId + '"></variable>' +
                        '<named-constant id="' + idList[i] + '"></named-constant>' +
                        '</eq>';
                }

                conditionAttribute += '</OR>';
            }

            return conditionAttribute;
        }
    });
});
