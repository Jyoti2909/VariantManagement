/* Create temp table to store result of the procedure 'RESTORE FILELISTONLY' */	
CREATE TABLE #file_list (
	LogicalName nvarchar(128) NOT NULL,
	PhysicalName nvarchar(260) NOT NULL,
	Type char(1) NOT NULL,
	FileGroupName nvarchar(120) NULL,
	Size numeric(20, 0) NOT NULL,
	MaxSize numeric(20, 0) NOT NULL,
	FileID bigint NULL,
	CreateLSN numeric(25,0) NULL,
	DropLSN numeric(25,0) NULL,
	UniqueID uniqueidentifier NULL,
	ReadOnlyLSN numeric(25,0) NULL ,
	ReadWriteLSN numeric(25,0) NULL,
	BackupSizeInBytes bigint NULL,
	SourceBlockSize int NULL,
	FileGroupID int NULL,
	LogGroupGUID uniqueidentifier NULL,
	DifferentialBaseLSN numeric(25,0)NULL,
	DifferentialBaseGUID uniqueidentifier NULL,
	IsReadOnly bit NULL,
	IsPresent bit NULL,
	TDEThumbprint varbinary(32) NULL
);
				
/* SQL server version check is added because since SQL2016 it is required to add fieldd SnapshotURL for results of RESTORE FILELISTONLY */
				
DECLARE @sqlVersion varchar(30)
SET @sqlVersion = convert(varchar(30), SERVERPROPERTY('productversion'))
				
IF @sqlVersion > '12.0.9999.9'
	BEGIN
		ALTER TABLE #file_list ADD SnapshotURL nvarchar(360) NULL
	END		

--Get data and log logical names from the backup of the database
INSERT INTO #file_list
EXEC('RESTORE FILELISTONLY FROM DISK=''' + @path_to_db_bak + '''')

DECLARE @restore_database_query NVARCHAR(4000)

DECLARE @logical_data_name NVARCHAR(128)
DECLARE @logical_log_name NVARCHAR(128)

SET @restore_database_query = N'RESTORE DATABASE [' + @database_name_to_sql_object + '] '
SET @restore_database_query += N'FROM DISK=''' + @path_to_db_bak + ''' '
SET @restore_database_query += N'WITH '

--Evaluate restoration path for *.mdf and *.ldf files
DECLARE @db_root_path NVARCHAR(1000);
DECLARE @data_path NVARCHAR(1000);
DECLARE @log_path NVARCHAR(1000);

-- Evaluate SQL server's paths to data and log files to use them during restoration of the database
DECLARE @sql_server_data_path NVARCHAR(260)

DECLARE @get_next_data_path_param_definition nvarchar(500)
DECLARE @get_next_data_path nvarchar(4000)

SET @get_next_data_path_param_definition = N'@sql_server_data_path NVARCHAR(260) OUTPUT, @sql_server_data_paths_list NVARCHAR(4000) OUTPUT'; 
SET @get_next_data_path = N'
IF (LEN(@sql_server_data_paths_list) > 0)
BEGIN
	IF CHARINDEX( '';'', @sql_server_data_paths_list ) > 0 
		SELECT @sql_server_data_path = LEFT( @sql_server_data_paths_list, CHARINDEX( '';'', @sql_server_data_paths_list )  - 1 ) ,
		@sql_server_data_paths_list = RIGHT( @sql_server_data_paths_list, LEN( @sql_server_data_paths_list ) - CHARINDEX( '';'', @sql_server_data_paths_list ) ) 
	ELSE 
		SELECT @sql_server_data_path = @sql_server_data_paths_list, @sql_server_data_paths_list = SPACE(0)
END
IF (LEN(@sql_server_data_path) > 0)
BEGIN
	-- Create directory if it does not exist. This is necessary for the case of remote sql server
	EXECUTE master.sys.xp_create_subdir @sql_server_data_path
END
ELSE
BEGIN
	EXEC master.dbo.xp_instance_regread N''HKEY_LOCAL_MACHINE'',N''Software\Microsoft\MSSQLServer\MSSQLServer'',N''DefaultData'', @sql_server_data_path output, ''no_output''
	IF (@sql_server_data_path IS NULL OR LEN(@sql_server_data_path) = 0)
	BEGIN
		EXEC master.dbo.xp_instance_regread N''HKEY_LOCAL_MACHINE'',N''Software\Microsoft\MSSQLServer\Setup'',N''SQLDataRoot'', @sql_server_data_path output, ''no_output'' 
		SET @sql_server_data_path = @sql_server_data_path + N''\Data''
	END
END'

DECLARE @current_timestamp NVARCHAR(1000)
SET @current_timestamp = CONVERT(NVARCHAR, DATEDIFF(SECOND,{d '1970-01-01'},GETDATE()))
DECLARE @data_files_cursor CURSOR
DECLARE @fileCounter INT = 1

SET @data_files_cursor = CURSOR FOR
SELECT [LogicalName] FROM #file_list WHERE [Type]='D' AND [PhysicalName] like '%.mdf'

OPEN @data_files_cursor
FETCH NEXT FROM @data_files_cursor
INTO @logical_data_name

WHILE @@FETCH_STATUS = 0
BEGIN
	EXECUTE sp_executesql @get_next_data_path, @get_next_data_path_param_definition, @sql_server_data_path=@sql_server_data_path OUTPUT, @sql_server_data_paths_list=@sql_server_data_paths_list OUTPUT
	SET @data_path = @sql_server_data_path + '\' + @database_name + '_' + CAST(@fileCounter as NVARCHAR(4)) + '_' + @current_timestamp + '.mdf'
	SET @restore_database_query += N'MOVE ''' + @logical_data_name + ''' TO ''' + @data_path + ''', '

	SET @fileCounter += 1
	FETCH NEXT FROM @data_files_cursor
	INTO @logical_data_name
END; 

SET @data_files_cursor = CURSOR FOR
SELECT [LogicalName] FROM #file_list WHERE [Type]='D' AND [PhysicalName] like '%.ndf'

OPEN @data_files_cursor
FETCH NEXT FROM @data_files_cursor
INTO @logical_data_name

WHILE @@FETCH_STATUS = 0
BEGIN
	EXECUTE sp_executesql @get_next_data_path, @get_next_data_path_param_definition, @sql_server_data_path=@sql_server_data_path OUTPUT, @sql_server_data_paths_list=@sql_server_data_paths_list OUTPUT
	SET @data_path = @sql_server_data_path + '\' + @database_name + '_' + CAST(@fileCounter as NVARCHAR(4)) + '_' + @current_timestamp + '.ndf'
	SET @restore_database_query += N'MOVE ''' + @logical_data_name + ''' TO ''' + @data_path + ''', '

	SET @fileCounter += 1
	FETCH NEXT FROM @data_files_cursor
	INTO @logical_data_name
END;

CLOSE @data_files_cursor
DEALLOCATE @data_files_cursor
	
SET @logical_log_name = (SELECT [LogicalName] FROM #file_list WHERE [Type]='L')
EXECUTE sp_executesql @get_next_data_path, @get_next_data_path_param_definition, @sql_server_data_path=@sql_server_data_path OUTPUT, @sql_server_data_paths_list=@sql_server_data_paths_list OUTPUT
SET @log_path = @sql_server_data_path + '\' + @database_name + '_' + @current_timestamp + '_log.ldf'
	
SET @restore_database_query += N'MOVE ''' + @logical_log_name + ''' TO ''' + @log_path + ''', '
SET @restore_database_query += N'REPLACE, '
SET @restore_database_query += N'STATS = 10'
	
PRINT @restore_database_query
EXECUTE sp_executesql @restore_database_query