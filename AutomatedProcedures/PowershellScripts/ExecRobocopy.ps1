Param(
	[Parameter(Mandatory = $true)]
	[String]
	$SourceDir,

	[Parameter(Mandatory = $true)]
	[String]
	$TargetDir
)

Robocopy.exe $SourceDir $TargetDir /E /NP /NJH /NFL /NDL
if ($LASTEXITCODE -ge 8) {
	#if Robocopy exit code greater than 7 means that there was error during its exectution
	#detailes available here: https://ss64.com/nt/robocopy-exit.html
	#robocopy exit code is a bitmap, below described error bits:
	# 8 - Some files or directories could not be copied	(copy errors occurred and the retry limit was exceeded). Check these errors further.
	# 16 - Serious error. Robocopy did not copy any files. Either a usage error or an error due to insufficient access privileges on the source or destination directories.
	exit 1
}