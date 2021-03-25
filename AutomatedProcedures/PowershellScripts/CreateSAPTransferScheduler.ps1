$action = New-ScheduledTaskAction -Execute "C:\ARAS_SAP_Transfer\SAPTransfer.exe"
$trigger = New-ScheduledTaskTrigger -Daily -At 12am
$task = Register-ScheduledTask -TaskName "ARAS SAP Transfer" -Trigger $trigger -Action $action
$task.Triggers.Repetition.Duration = "P1D" 
$task.Triggers.Repetition.Interval = "PT15M"
$task | Set-ScheduledTask