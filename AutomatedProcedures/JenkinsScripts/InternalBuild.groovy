def branchName = (env.CHANGE_TARGET) ? env.CHANGE_TARGET : env.BRANCH_NAME
def repositoryUrl = scm.getUserRemoteConfigs()[0].getUrl()
def tagName = branchName.replace('RELS', 'CleanInnovator').replace('-0', '').replace('-', '')

def ciPipeline
def deployPipeline

try {
	node('master') {
			configFileProvider([configFile(fileId: 'crt-internal-build-params', variable: 'internalBuildParamsFile')]) {
			params = readJSON file: "${internalBuildParamsFile}"

			params["RepositoryUrl"] = repositoryUrl
			params["BranchName"] = branchName
			params["Path.To.CodeTree.Zip"] = String.format("%s\\%s\\CodeTree.zip", params["Path.To.Baseline.Folder"], tagName)
			params["Path.To.DB.Bak"] = String.format("%s\\%s\\DB.bak", params["Path.To.Baseline.Folder"], tagName)
		}

		checkout([
			$class: 'GitSCM',
			branches: scm.branches,
			extensions: scm.extensions,
			userRemoteConfigs: scm.userRemoteConfigs
		])

		ciPipeline = readFile 'Jenkinsfile'
		deployPipeline = readFile 'AutomatedProcedures/JenkinsScripts/deploy.groovy'
	}
	try {
		withEnv(["Perform.Import.Of.SampleData=true", "DoUpdateCrtVersion=${params["DoUpdateCrtVersion"]}"]) {
			evaluate ciPipeline
			withEnv(["MSSQL.Server=${params["MSSQL.Server"]}",
					"Path.To.CodeTree.Zip=${params["Path.To.CodeTree.Zip"]}",
					"Path.To.DB.Bak=${params["Path.To.DB.Bak"]}",
					"Path.To.Sandbox.Directory=${params["Path.To.Sandbox.Directory"]}",
					"LicenseActivationKey=${params["LicenseActivationKey"]}",
					"LicenseKey=${params["LicenseKey"]}",
					"NodeLabel=${params.NodeLabel}",
					"CustomBuildAgentNodeLabel=${params.CustomBuildAgentNodeLabel}",
					"SkipSetTag=${params.SkipSetTag}",
					"BranchName=${env.BRANCH_NAME}"
					]) {
				evaluate deployPipeline
			}
		}
	}
	finally {
		properties([
			disableConcurrentBuilds(),
			buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '50')),
		])
	}
}
finally {
	node('master') {
		deleteDir()
	}
}