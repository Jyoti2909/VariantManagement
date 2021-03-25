// This file is used by Code Analysis to maintain SuppressMessage 
// attributes that are applied to this project.
// Project-level suppressions either have no target or are given 
// a specific target and scoped to a namespace, type, member, etc.
//
// To add a suppression to this file, right-click the message in the 
// Code Analysis results, point to "Suppress Message", and click 
// "In Suppression File".
// You do not need to add suppressions to this file manually.
using System.Diagnostics.CodeAnalysis;

[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1040:AvoidEmptyInterfaces", Scope = "type", Target = "Aras.Common.IDataAccessLayer")]
[assembly: SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.BaseDataAccessLayer.ApplyItemWithGrantIdentity(Aras.IOM.Item,System.String)~Aras.IOM.Item")]
[assembly: SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.BaseDataAccessLayer.ApplyItem(Aras.IOM.Item)~Aras.IOM.Item")]
[assembly: SuppressMessage("Design", "CA1054:Uri parameters should not be strings", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.ServerConnectionProvider.Get(System.String,System.String,System.String,System.String)~Aras.IOM.IServerConnection")]
[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1032:ImplementStandardExceptionConstructors", Scope = "type", Target = "Aras.Common.CsvParsingException")]
[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2237:MarkISerializableTypesWithSerializable", Scope = "type", Target = "Aras.Common.CsvParsingException")]
[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "Ip", Scope = "member", Target = "Aras.Common.IDataAccessLayer.#ClientIpAddress")]
[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1709:IdentifiersShouldBeCasedCorrectly", MessageId = "Ip", Scope = "member", Target = "Aras.Common.IDataAccessLayer.#ClientIpAddress")]
[assembly: System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1062:Validate arguments of public methods", MessageId = "0", Scope = "member", Target = "Aras.Common.BaseDataAccessLayer.#InstantiateWorkflow(Aras.IOM.Item,System.String)")]
[assembly: SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.BaseDataAccessLayer.PromoteItem(Aras.IOM.Item,System.String,System.String)~Aras.IOM.Item")]
[assembly: SuppressMessage("Design", "CA1062:Validate arguments of public methods", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.BaseDataAccessLayer.UnlockItem(Aras.IOM.Item)~Aras.IOM.Item")]
[assembly: SuppressMessage("Naming", "CA1716:Identifiers should not match keywords", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.IBaseDataAccessLayer.NewError(System.String)~Aras.IOM.Item")]
[assembly: SuppressMessage("Design", "CA1054:Uri parameters should not be strings", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.IServerConnectionProvider.Get(System.String,System.String,System.String,System.String)~Aras.IOM.IServerConnection")]
[assembly: SuppressMessage("Naming", "CA1716:Identifiers should not match keywords", Justification = "<Pending>", Scope = "member", Target = "~M:Aras.Common.IServerConnectionProvider.Get(System.String,System.String,System.String,System.String)~Aras.IOM.IServerConnection")]
