def buildAgentNodeLabel = env.CustomBuildAgentNodeLabel ?: "master"
def commitPointerToDeploy = env.BranchName ?: env.TagName
def deployAgentNodeLabel = env.NodeLabel
def buildNumber = env.BUILD_NUMBER

def buildSpecificName
def repositoryUrl
def jenkinsfileProperties
def jenkinsfileUtilities
def innovatorDeploymentPackageArchiveName

try {
	node(buildAgentNodeLabel) {
		buildSpecificName = "${commitPointerToDeploy}-${buildNumber}"
		innovatorDeploymentPackageArchiveName = "Deployment-Package-From-${buildSpecificName}.zip"

		stage("Prepare Deployment Package") {
			repositoryUrl = scm.getUserRemoteConfigs()[0].getUrl()
			def repositoryName = repositoryUrl.tokenize('/').last()
			def referenceRepository = (env.sandboxRootDir == null) ? [] : [[$class: "CloneOption", reference: "${env.sandboxRootDir}\\${repositoryName}"]]

			checkout([
				$class: "GitSCM",
				branches: scm.branches,
				extensions: scm.extensions + referenceRepository,
				userRemoteConfigs: scm.userRemoteConfigs
			])

			jenkinsfileProperties = readJSON file: "AutomatedProcedures/JenkinsfileProperties.json"
			jenkinsfileUtilities = load "AutomatedProcedures/JenkinsScripts/JenkinsfileUtilities.groovy"

			jenkinsfileUtilities.addNantEnvironmentVariable("Commit.Pointer", commitPointerToDeploy)
			jenkinsfileUtilities.addNantEnvironmentVariable("Deployment.Package.Archive.Name", innovatorDeploymentPackageArchiveName)

			jenkinsfileUtilities.runNantTargets(["CreateZipWithDeploymentPackageAndScripts"])

			stash name: "InnovatorDeploymentPackage", includes:innovatorDeploymentPackageArchiveName
			stash name: "Tests", includes:"Tests/**"
		}
	}

	def testsToRunInParallel = [
		[stage: "RunStandardIntegrationTests1", part: 1],
		[stage: "RunStandardIntegrationTests2", part: 2],
		[stage: "RunStandardIntegrationTests3", part: 3],
		[stage: "RunStandardIntegrationTests4", part: 4],
		[stage: "RunStandardIntegrationTests5", part: 5],
		[stage: "RunStandardIntegrationTests6", part: 6],
		[stage: "RunStandardIntegrationTests7", part: 7],
		[stage: "RunStandardIntegrationTests8", part: 8]
	]

	def tasks = [:]
	testsToRunInParallel.each { testLaunch ->
		tasks[testLaunch.stage] = {
			node(deployAgentNodeLabel) {
				stage("Cleanup Jenkins Workspace") {
						deleteDir()
				}

				unstash name: "InnovatorDeploymentPackage"
				unstash name: "Tests"
				unzip zipFile: innovatorDeploymentPackageArchiveName

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
					//based on the Name.Of.Innovator.Instance path to Innovator and url will be generated
					jenkinsfileUtilities.addNantEnvironmentVariable("Build.Number", buildNumber + "-" + testLaunch.part)
					jenkinsfileUtilities.addNantEnvironmentVariable("Path.To.Deployment.Package.Dir", pwd())

					try {
						stage("Setup Innovator") {
							jenkinsfileUtilities.runNantTargets(["SetupParameters.For.Deploy.Task", "Clean.Up"])
							jenkinsfileUtilities.runNantTargets(["Setup.Innovator.For.Deploy.Task"])
						}

						stage("Deploy") {
							jenkinsfileUtilities.addNantEnvironmentVariable("Feature.License.Credential.IDs", existingFeatureLicensesIDs.join(','));
							jenkinsfileUtilities.runNantTargets(["SetupParameters.For.Deploy.Task", "Deploy.Package"])
						}

						stage(testLaunch.stage) {
							jenkinsfileUtilities.addNantEnvironmentVariable("Integration.Tests.Part", testLaunch.part)
							jenkinsfileUtilities.runNantTargets(['SetupParameters.For.Deploy.Task', 'Run.Standard.Integration.Tests'])
						}
					} finally {
						stage("Upload deployment package") {
							archiveArtifacts artifacts: "*-Package-From-*.zip", allowEmptyArchive: true
						}

						stage("Cleanup Innovator") {
							jenkinsfileUtilities.runNantTargets(["SetupParameters.For.Deploy.Task", "Clean.Up"])
						}
					}
				}
			}
		}
	}

	parallel tasks

	currentBuild.result = "SUCCESS"
} catch (Exception ex) {
	echo "ERROR MESSAGE: " + ex.getMessage()
	currentBuild.result = "FAILURE"
	throw ex
}