@echo off
SET Path.To.Installed.Innovator="T:"
SET Url.Of.Installed.Innovator="http://prod-server/InnovatorServer_Prod"
SET MSSQL.Server="(local)"
SET MSSQL.Database.Name="ARAS_PLM_PROD"
SET Agent.Service.Name="ArasInnovatorAgent_AgentService_innovatorServer"
SET Agent.Service.Host.Name="prod-server"

Call Deploy.bat %NAntParameters%