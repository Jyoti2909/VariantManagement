'name: iis-setup.vbs
'purpose: Create the Innovator virtual root and set all of the IIS properties

Const APPLICATION_POOLED_PROCESS_IIS5 = 2

Dim MetabasePath,sInstanceName,sInstallDir

iis_setup
wscript.quit(0)

' End of Main

sub iis_setup()
 DIM IISOBJ,newdir
 sInstanceName = getargdef(0,"InnovatorWebService")
 sInstallDir = getargdef(1,"C:\WEB\innovator")
 MetabasePath = getargdef(2,"IIS://Localhost/w3svc/1/root")

 'wscript.echo "InstanceName = " & sInstanceName
 'wscript.echo "Web Root     = " & sInstallDir
 'wscript.echo "MetabasePath = " & MetabasePath

 Set IISOBJ = GetObject(MetabasePath)
 'wscript.echo "Creating " & sInstanceName
 Set NewDir = IISOBJ.Create("IIsWebVirtualDir", sInstanceName)
 NewDir.Path = slashreplace(sInstallDir)
 NewDir.DefaultDoc = "Innovator.asmx"
 NewDir.ContentIndexed = False
 NewDir.AccessWrite = false
 NewDir.AccessScript = True

 NewDir.SetInfo
 Set NewDir = Nothing
 Set IISObJ = Nothing

 '-----------------------------------
 ' create the innovator application
 '-----------------------------------

 set NewDir = GetObject(MetabasePath & "/" & sInstanceName)

 NewDir.AppCreate2 APPLICATION_POOLED_PROCESS_IIS5

 NewDir.AppFriendlyName = sInstanceName
 newdir.put "AppAllowDebugging", true
' newdir.put "AllowAnonymous", true
' newdir.put "AnonymousOnly", true
 NewDir.SetInfo

end sub

function slashreplace(str)
 dim nstr
 nstr = replace(str,"/","\")
 slashreplace = nstr
end function

function getargdef(n,default)
 if not wscript.arguments.length > n then
  getargdef = default
 elseif wscript.arguments(n) = "." then
  getargdef = default
 else
  getargdef = wscript.arguments(n)
 end if
end function



