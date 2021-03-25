define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.EffectivityExpression.ExpressionGrammar',
		null,
		{
			grammarFile: null,
			groupName: null,
			scope: null,

			constructor: function (args) {
				this.grammarFile = args.grammarFile;
				this.groupName = args.groupName;
				this.scope = args.scope;
			},

			getGrammarTemplate: function () {
				const templateGroups = {};
				templateGroups[this.groupName] = {
					type: 'grammar',
					grammarFile: this.grammarFile,
					lexemStyles: {}
				};
				return { template: [this.groupName], templateGroups: templateGroups };
			},

			getGrammarData: function () {
				const variablesHash = {};

				if (this.scope) {
					const variables = this.scope.variables;
					const variableNames = Object.keys(variables);
					const variableNamesCount = variableNames.length;

					for (let varIndex = 0; varIndex < variableNamesCount; varIndex++) {
						const variableName = variableNames[varIndex];
						const variable = variables[variableName];

						const namedConstants = variable.namedConstants;
						const namedConstantNames = Object.keys(namedConstants);
						const namedConstantNamesCount = namedConstantNames.length;

						const namedConstantsHash = [];
						for (
							let ncIndex = 0;
							ncIndex < namedConstantNamesCount;
							ncIndex++
						) {
							const namedConstantName = namedConstantNames[ncIndex];
							namedConstantsHash.push(namedConstantName);
						}

						variablesHash[variableName] = {
							type: variable.datatype,
							namedConstants: namedConstantsHash
						};
					}
				}

				return variablesHash;
			}
		}
	);
});
