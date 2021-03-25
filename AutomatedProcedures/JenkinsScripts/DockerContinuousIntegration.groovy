properties([
	pipelineTriggers([]),
	disableConcurrentBuilds(),
	buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '50'))
])

def jenkinsfileProperties
def jenkinsfileUtilities

def emailExtRecipientProviders
def EmailSuccess
def EmailFailure
def EmailRecipients

def isPullRequest = env.CHANGE_TARGET ? true : false
def repositoryUrl

def buildAgentNodeLabel = env.CustomBuildAgentNodeLabel ?: 'DockerHost'
def localSharedBaselinesFolder = env.LocalSharedBaselinesFolder ?: "C:\\Baselines"

try
{
	node(buildAgentNodeLabel) {
		//CHANGE_TARGET: For a multibranch project corresponding to some kind of change request, this will be set to the target or base branch to which the change could be merged.
		def commitPointer = env.CHANGE_TARGET ?: env.BRANCH_NAME

		emailExtRecipientProviders = env["EmailExtRecipientProviders"] ?: ''
		EmailSuccess = env["EmailSuccess"] ?: ''
		EmailFailure = env["EmailFailsure"] ?: ''
		EmailRecipients = EmailSuccess

		stage('Checkout') {
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

		def imageName = env.BRANCH_NAME.toLowerCase()
		try {
			withEnv(env.getEnvironment().collect({ name, value -> value.contains(" ") ? "${name}=\\\"${value.replaceAll("\"", "")}\\\"" : "${name}=${value}" })) {
				def imageArgs = "-v \"${PathToSharedMachineSpecificIncludes}:${env["MachineSpecific.Includes.Folder.Path"]}\" -v \"${PathToCurrentSharedBaselinesNetworkLocation}:${localSharedBaselinesFolder}:ro\""
				docker.build(imageName).inside(imageArgs) {
					jenkinsfileProperties = readJSON file: "AutomatedProcedures/JenkinsfileProperties.json"
					jenkinsfileUtilities = load "AutomatedProcedures/JenkinsScripts/JenkinsfileUtilities.groovy"

					jenkinsfileUtilities.addNantEnvironmentVariable('Local.Shared.Baselines.Folder', localSharedBaselinesFolder)

					def credentialBindings = []
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
						jenkinsfileUtilities.addNantEnvironmentVariable('Commit.Pointer', commitPointer)
						// In order to have unique timestamp for build and not for every NAnt launch.
						def dateFormatter = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH-mm-ss")
						def buildIdentifier = "${BRANCH_NAME}-${BUILD_NUMBER}"

						jenkinsfileUtilities.addNantEnvironmentVariable('This.Script.Start.Time.As.Sortable.Date', dateFormatter.format(new Date()))
						jenkinsfileUtilities.addNantEnvironmentVariable('Build.Identifier', buildIdentifier)
						jenkinsfileUtilities.addNantEnvironmentVariable('Deployment.Package.Build.Number', BUILD_NUMBER)
						jenkinsfileUtilities.addNantEnvironmentVariable('Feature.License.Credential.IDs', existingFeatureLicensesIDs.join(','));

						try {
							timestamps {
								stage('ContinuousIntegration') {
									jenkinsfileUtilities.runNantTargets(['ContinuousIntegration'])
								}

								if (!isPullRequest && env.DoUpdateCrtVersion) {
									stage('Update Version') {
										def gitTagCredentialId = scm.getUserRemoteConfigs()[0].getCredentialsId()

										sshagent([gitTagCredentialId]) {
											jenkinsfileUtilities.runNantTargets(['Update.CRT.Version.Git.Tag'])
										}
									}
								}
							}

							currentBuild.result = 'SUCCESS'
						} catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
							currentBuild.result = 'ABORTED'

							throw e
						} finally {
							stage('Upload logs') {
								step([$class: 'NUnitPublisher', testResultsPattern: '/AutomatedProceduresOutput/TestsOutput/nunit*.results.xml', debug: false, keepJUnitReports: true, skipJUnitArchiver:false, failIfNoResults: false])
								junit allowEmptyResults: true, testResults: '/AutomatedProceduresOutput/TestsOutput/ClientTests/TestResults/**/*.xml'

								publishHTML (target: [
									allowMissing: false,
									alwaysLinkToLastBuild: false,
									keepAll: true,
									reportDir: 'AutomatedProceduresOutput/TestsOutput/UnitTestsCoverageSummary',
									reportFiles: 'summary.htm',
									reportName: "OpenCover Report"
								])

								publishHTML (target: [
									allowMissing: false,
									alwaysLinkToLastBuild: false,
									keepAll: true,
									reportDir: 'AutomatedProceduresOutput/TestsOutput/ClientTests/CodeCoverage',
									reportFiles: '**/index.html',
									includes: '**/index.html,**/*.css,**/*.js,**/*.png',
									reportName: "Karma Reports"
								])

								archiveArtifacts artifacts: 'AutomatedProceduresOutput/Log-Package-From-*.zip', allowEmptyArchive: true
								archiveArtifacts artifacts: 'Deployment-Package-From-*.zip', allowEmptyArchive: true
							}
						}
					}
				}
			}
		} finally {
			stage('Cleanup Jenkins Workspace') {
				if (currentBuild.result == 'ABORTED') {
					jenkinsfileUtilities.runNantTargets(['SetupParameters.For.Continuous.Task', 'Clean.Up'])
				}

				deleteDir()

				if (isPullRequest) {
					bat "docker rmi ${imageName} -f"
				}
			}
		}
	}
} finally {
	stage('Notification') {
		if (currentBuild.result != 'SUCCESS') {
			def office365ConnectorCredential = jenkinsfileProperties?.notification?.office365Connector
			if (office365ConnectorCredential && !env.CHANGE_TARGET) {
				def credentialBindings = []
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