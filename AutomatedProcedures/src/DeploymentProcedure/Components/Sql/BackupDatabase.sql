DBCC SHRINKDATABASE(@database_name);
BACKUP DATABASE @database_name TO DISK = @path_to_db_backup WITH NOFORMAT, INIT, COMPRESSION;
