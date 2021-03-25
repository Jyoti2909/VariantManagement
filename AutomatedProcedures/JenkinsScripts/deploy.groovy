timestamps {
	withFolderProperties {
		// A pipeline script intended to perform deploy on a target environment via Jenkins
		def commitPointerToDeploy = env.BranchName ?: env.TagName
		def buildSpecificName
		def repositoryUrl
		def setTag = !new Boolean(env.SkipSetTag)
		def setupNewInstance = !new Boolean(env.DoNotSetupNewInstance)
		def userEmailForTag
		def userNameForTag
		def buildAgentNodeLabel = env.CustomBuildAgentNodeLabel ?: 'master'
		def deployAgentNodeLabel = env.NodeLabel ?: commitPointerToDeploy
		def innovatorLicenseStringSecretTextId = env.InnovatorLicenseStringSecretTextId ?: 'Innovator.License.String'
		def gitTagCredentialId = env.GitTagCredentialId ?: scm.getUserRemoteConfigs()[0].getCredentialsId()

		if (!commitPointerToDeploy) {
			error "The BranchName or TagName parameter is mandatory for deployment jobs." + 
				"Go 'Configure'->'This project is parametrised' and add one of these string parameters: BranchName or TagName"
		}

		if (setTag) {
			if (env.UserEmailForTag && env.UserNameForTag) {
				userEmailForTag = env.UserEmailForTag
				userNameForTag = env.UserNameForTag
			} else {
				error "The UserEmailForTag and UserNameForTag parameters are mandatory for deployment jobs." +
					"They are used to create a git tag" 
					"Go 'Configure'->'This project is parametrised' and add these string parameters"
			}
		}

		def credentialBindings = []

		def gitCheckoutTimeout = 60
		def jenkinsfileProperties
		def jenkinsfileUtilities

		def emailExtRecipientProviders
		def EmailSuccess
		def EmailFailure
		def EmailRecipients
		def innovatorDeploymentPackageArchiveName

		def useNugetPackage = false
		def nugetPackageId = env["Deployment.Package.Id"]

		try
		{
			node('master') {
				buildSpecificName = "${commitPointerToDeploy}-${env.BUILD_NUMBER}"
				innovatorDeploymentPackageArchiveName = "Deployment-Package-From-${buildSpecificName}.zip"
				emailExtRecipientProviders = (env["EmailExtRecipientProviders"] == null) ? '' : env["EmailExtRecipientProviders"]
				EmailRecipients = (env["EmailSuccess"] == null) ? '' : env["EmailSuccess"]
				EmailFailure = (env["EmailFailure"] == null) ? '' : env["EmailFailure"]

				//@script folder created during git clone when Jenkins pipeline job is used
				//if multibranch pipelie is used, repository is clonned to a curent directory
				def pathToScript = "${pwd()}@script"
				def pathToRepo = fileExists(pathToScript) ? pathToScript : pwd()
				dir(pathToRepo) {
					stash name: 'AutomatedProcedures', includes: 'AutomatedProcedures/**'
				}
			}
			node(buildAgentNodeLabel) {
				buildAgentNodeLabel = env.NODE_NAME
				cleanWs notFailBuild: true
				unstash name: 'AutomatedProcedures'

				jenkinsfileProperties = readJSON file: "AutomatedProcedures/JenkinsfileProperties.json"
				jenkinsfileUtilities = load "AutomatedProcedures/JenkinsScripts/JenkinsfileUtilities.groovy"

				jenkinsfileUtilities.addNantEnvironmentVariable('Commit.Pointer', commitPointerToDeploy)
				jenkinsfileUtilities.addNantEnvironmentVariable('Deployment.Package.Archive.Name', innovatorDeploymentPackageArchiveName)
				jenkinsfileUtilities.addNantEnvironmentVariable('Deployment.Package.Build.Number', env.BUILD_NUMBER)

				jenkinsfileProperties.credentials.each { credential ->
					jenkinsfileUtilities.putCredentialToBindingsIfValid(credential, credentialBindings)
				}

				withCredentials(credentialBindings) {
					stage('Check nuget package') {
						if (env['Nuget.Publishing.Source']) {
							useNugetPackage = jenkinsfileUtilities.runNantTargets(['Check.Nuget.Package.Existense'], true) == 0
						} else {
							echo "Nuget.Publishing.Source is not specified. Build new package"
						}
					}
					
					stage('Build package') {
						if (useNugetPackage) {
							jenkinsfileUtilities.addNantEnvironmentVariable('Do.Build.Deployment.Tool', false)
						} else {
							echo "Nuget package has not been found at specified source (${env['Nuget.Publishing.Source']}). Build new package"

							repositoryUrl = scm.getUserRemoteConfigs()[0].getUrl()
							def repositoryName = repositoryUrl.tokenize('/').last()
							def referenceRepository = (env.sandboxRootDir == null) ? [] : [[$class: 'CloneOption', reference: "${env.sandboxRootDir}\\${repositoryName}"]]

							checkout([
								$class: 'GitSCM',
								branches: scm.branches,
								extensions: scm.extensions + referenceRepository,
								userRemoteConfigs: scm.userRemoteConfigs
							])
						}

						jenkinsfileUtilities.runNantTargets(['CreateZipWithDeploymentPackageAndScripts'])
						stash name: "InnovatorDeploymentPackage", includes:innovatorDeploymentPackageArchiveName
					}
				}
			}
			node(deployAgentNodeLabel) {
				stage ('Unstash package') {
					cleanWs notFailBuild: true
					unstash name: "InnovatorDeploymentPackage"
					unzip zipFile: innovatorDeploymentPackageArchiveName
				}

				jenkinsfileProperties.credentials.each { credential ->
					jenkinsfileUtilities.putCredentialToBindingsIfValid(credential, credentialBindings)
				}

				def existingFeatureLicensesIDs = []
				// attach feature licence credential IDs specified in the Feature.License.Credential.IDs parameter
				def featureLicenseCredentialIDs = env["Feature.License.Credential.IDs"]?.tokenize('\n;, ') ?: jenkinsfileProperties.featureLicenseCredentialIDs
				featureLicenseCredentialIDs.each { credentialId ->
					def featureLicenseCredential = [$class: "StringBinding", credentialsId: credentialId, variable: credentialId]
					if (jenkinsfileUtilities.putCredentialToBindingsIfValid(featureLicenseCredential, credentialBindings)) {
						existingFeatureLicensesIDs.add(credentialId)
					}
				}

				withCredentials(credentialBindings) {
					//based on the Name.Of.Innovator.Instance path to Innovator and url will be generated
					jenkinsfileUtilities.addNantEnvironmentVariable('Build.Number', env.BUILD_NUMBER)
					jenkinsfileUtilities.addNantEnvironmentVariable('Path.To.Deployment.Package.Dir', pwd())
					jenkinsfileUtilities.addNantEnvironmentVariable('MachineSpecific.Includes.Folder.Path', '')

					try {
						if (setupNewInstance) {
							stage('Setup Innovator') {
								jenkinsfileUtilities.runNantTargets(['SetupParameters.For.Deploy.Task', 'Clean.Up'])
								jenkinsfileUtilities.runNantTargets(['Setup.Innovator.For.Deploy.Task'])
							}
						} else {
							echo "Innovator Setup is skipped, proceed to deploy."
						}
						stage('Deploy package') {
							jenkinsfileUtilities.addNantEnvironmentVariable('Feature.License.Credential.IDs', existingFeatureLicensesIDs.join(','));
							jenkinsfileUtilities.runNantTargets(['SetupParameters.For.Deploy.Task', 'Deploy.Package'])
						}
						if (env.DoBackup) {
							stage('Generate a new baseline') {
								jenkinsfileUtilities.runNantTargets(['Create.New.Baseline'])
							}
						}
					}
					finally {
						stage('Upload package to Jenkins') {
							archiveArtifacts artifacts: 'AutomatedProceduresOutput/Log-Package-From-*.zip', allowEmptyArchive: true
							archiveArtifacts artifacts: '*-Package-From-*.zip', allowEmptyArchive: true
						}
					}
				}
			}
			if (setTag) {
				node(buildAgentNodeLabel) {
					stage('Git tag') {
						if (repositoryUrl.startsWith('https://')) {
							withCredentials([usernamePassword(credentialsId: gitTagCredentialId, passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
								bat("git config user.email ${userEmailForTag}")
								bat("git config user.name \"${userNameForTag}\"")
								bat("git tag ${buildSpecificName} -a -m \"Jenkins ${buildSpecificName} build\"")
								bat("git push ${repositoryUrl.replace("https://", "https://${GIT_USERNAME}:${GIT_PASSWORD}@").replace("%", "%%")} ${buildSpecificName}")
							}
						}
						else {
							sshagent([gitTagCredentialId]) {
								bat("git config user.email ${userEmailForTag}")
								bat("git config user.name \"${userNameForTag}\"")
								bat("git tag ${buildSpecificName} -a -m \"Jenkins ${buildSpecificName} build\"")
								bat("git push ${repositoryUrl} ${buildSpecificName}")
							}
						}
					}
				}
			}
			currentBuild.result = 'SUCCESS'
		}
		finally {
			stage('Notification') {
				if (currentBuild.result == null) {
					currentBuild.result = 'FAILURE'

					def office365ConnectorCredential = jenkinsfileProperties?.notification?.office365Connector
					if (office365ConnectorCredential && !env.CHANGE_TARGET) {
						if (jenkinsfileUtilities.putCredentialToBindingsIfValid(office365ConnectorCredential, credentialBindings)) {
							withCredentials(credentialBindings) {
								office365ConnectorSend color: "FF0000", status: currentBuild.result, webhookUrl: MSTeamsWebHook
							}
						}
					}

					def recipientProviders = []
					if (emailExtRecipientProviders != null && emailExtRecipientProviders != '') {
						def providerNames = emailExtRecipientProviders.split()
						for (i = 0; i < providerNames.size(); i++) {
								recipientProviders.add([$class: providerNames[i]])
						}
					}
					def providedRecipients = recipientProviders.isEmpty() ? '' : emailextrecipients(recipientProviders)
					EmailRecipients = "${EmailFailure ?: ''} ${providedRecipients}".trim()
				}
				if (EmailRecipients) {
					emailext body: '$DEFAULT_CONTENT',subject: '[JENKINS] ' + '$DEFAULT_SUBJECT', to: EmailRecipients
				}
			}
		}
	}
}