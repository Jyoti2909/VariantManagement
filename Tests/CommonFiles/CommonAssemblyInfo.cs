using System;
using System.Reflection;
using System.Runtime.InteropServices;

// General Information about an assembly is controlled through the following
// set of attributes. Change these attribute values to modify the information
// associated with an assembly.

// TODO: Review the values of the assembly attributes

[assembly: AssemblyCompany("Aras Corporation")]
[assembly: AssemblyCulture("")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCopyright("© 2000-@CURRENTYEAR@ Aras Corporation. All rights reserved.")]
[assembly: AssemblyProduct("Aras Innovator")]

#if NETFX_CORE || __MOBILE__
[assembly: CLSCompliant(false)]
#else

[assembly: CLSCompliant(true)]
#endif

// Setting ComVisible to false makes the types in this assembly not visible 
// to COM components.  If you need to access a type in this assembly from 
// COM, set the ComVisible attribute to true on that type.

#if IEHostTestControl || ArasInstallationHelper
[assembly: ComVisible(true)]
#else
[assembly: ComVisible(false)]
#endif
