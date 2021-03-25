def getCustomCredentialId(credentialsId) {
	def customCredentialIdsMap = [
		'Innovator.License.String': env.InnovatorLicenseStringSecretTextId ?: 'InnovatorLicense12',
		'MSSQL.Innovator.Password': env.CustomMssqlInnovatorPasswordCredentialId,
		'MSSQL.SA.Password': env.CustomMssqlSaPasswordCredentialId,
		'MSSQL.Innovator.Regular.Password': env.CustomMssqlInnovatorRegularPasswordCredentialId,
		'MSTeamsWebHook': env.CustomMSTeamsWebHookCredentialId
	]

	return customCredentialIdsMap[credentialsId] ?: credentialsId
}

def putCredentialToBindingsIfValid(credential, credentialBindings) {
	def doAdd = false
	def credentialVariableName = credential.variable ?: credential.usernameVariable
	credential.credentialsId = getCustomCredentialId(credential.credentialsId)
	try {
		withCredentials([credential]) {
			def credentialVariableValue = env[credentialVariableName] ?: env[getCustomCredentialId(credentialVariableName)]
			doAdd = (credentialVariableValue != null) && credentialVariableValue != ''
		}
	}
	catch (org.jenkinsci.plugins.credentialsbinding.impl.CredentialNotFoundException e) {
		doAdd = false
	}
	finally {
		if (doAdd) {
			credentialBindings.add(credential)
		}
	}
	return doAdd
}

nantEnvironmentVariables = [:]
def addNantEnvironmentVariable(name, value) {
	nantEnvironmentVariables.put(name, value)
}

def getNantEnvironmentVariableArray() {
	def nantPropertyToJenkinsParametersMap = [
		'Innovator.License.Type': 'LicenseType',
		'Innovator.Activation.Key': 'LicenseActivationKey',
		'Innovator.License.Key': 'LicenseKey'
	]
	nantPropertyToJenkinsParametersMap.each { nantPropertyName, jenkinsParameter ->
		// Do not prioritize jenkins parameter over environment
		// since we tend to not use custom jenkins naming
		if (!env[nantPropertyName] && env[jenkinsParameter]) {
			addNantEnvironmentVariable(nantPropertyName, env[jenkinsParameter])
		}
	}
	def environmentVariables = []
	nantEnvironmentVariables.each { name, value ->
		environmentVariables.add("${name}=${value}")
	}
	return environmentVariables
}

def runNantTargets(targetList) {
	return runNantTargets(targetList, false)
}

def runNantTargets(targetList, doReturnStatus) {
	def exitCode = 0
	def environmentVariablesForNant = getNantEnvironmentVariableArray()
	def nantTargetsString = targetList.join(' ')

	withEnv(environmentVariablesForNant) {
		exitCode = bat returnStatus: doReturnStatus, encoding: 'UTF-8', script: """
			call AutomatedProcedures\\BatchUtilityScripts\\SetupExternalTools.bat
			%PathToNantExe% -buildfile:AutomatedProcedures\\NantScript.xml ${nantTargetsString}
		"""
	}

	return exitCode
}

return this