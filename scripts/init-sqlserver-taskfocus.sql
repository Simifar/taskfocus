/*
  TaskFocus — SQL Server init script
  Creates database + tables/indexes to match Prisma migration:
  prisma/migrations/20260406145941_init_sqlserver_schema/migration.sql

  Usage (PowerShell):
    sqlcmd -S "localhost\SQLEXPRESS" -E -i "scripts/init-sqlserver-taskfocus.sql"
*/

SET NOCOUNT ON;

DECLARE @dbName SYSNAME = N'taskfocus';

IF DB_ID(@dbName) IS NULL
BEGIN
  DECLARE @createDb NVARCHAR(MAX) = N'CREATE DATABASE [' + @dbName + N'];';
  EXEC (@createDb);
END
GO

USE [taskfocus];
GO

BEGIN TRY
  BEGIN TRAN;

  /* users */
  IF OBJECT_ID(N'[dbo].[users]', N'U') IS NULL
  BEGIN
    CREATE TABLE [dbo].[users] (
      [id] NVARCHAR(1000) NOT NULL,
      [email] NVARCHAR(1000) NOT NULL,
      [username] NVARCHAR(1000) NOT NULL,
      [passwordHash] NVARCHAR(1000) NOT NULL,
      [name] NVARCHAR(1000),
      [avatar] NVARCHAR(1000),
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL,
      CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
      CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email]),
      CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username])
    );
  END

  /* tasks */
  IF OBJECT_ID(N'[dbo].[tasks]', N'U') IS NULL
  BEGIN
    CREATE TABLE [dbo].[tasks] (
      [id] NVARCHAR(1000) NOT NULL,
      [userId] NVARCHAR(1000) NOT NULL,
      [title] NVARCHAR(1000) NOT NULL,
      [description] NVARCHAR(1000),
      [status] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_status_df] DEFAULT 'active',
      [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_priority_df] DEFAULT 'medium',
      [energyLevel] INT NOT NULL CONSTRAINT [tasks_energyLevel_df] DEFAULT 3,
      [dueDateStart] DATETIME2,
      [dueDateEnd] DATETIME2,
      [parentTaskId] NVARCHAR(1000),
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [tasks_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL,
      [completedAt] DATETIME2,
      CONSTRAINT [tasks_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END

  /* indexes */
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'tasks_userId_status_idx' AND object_id = OBJECT_ID(N'[dbo].[tasks]'))
    CREATE NONCLUSTERED INDEX [tasks_userId_status_idx] ON [dbo].[tasks]([userId], [status]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'tasks_userId_energyLevel_idx' AND object_id = OBJECT_ID(N'[dbo].[tasks]'))
    CREATE NONCLUSTERED INDEX [tasks_userId_energyLevel_idx] ON [dbo].[tasks]([userId], [energyLevel]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'tasks_parentTaskId_idx' AND object_id = OBJECT_ID(N'[dbo].[tasks]'))
    CREATE NONCLUSTERED INDEX [tasks_parentTaskId_idx] ON [dbo].[tasks]([parentTaskId]);

  /* foreign keys */
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'tasks_userId_fkey')
    ALTER TABLE [dbo].[tasks]
      ADD CONSTRAINT [tasks_userId_fkey]
      FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id])
      ON DELETE CASCADE ON UPDATE CASCADE;

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'tasks_parentTaskId_fkey')
    ALTER TABLE [dbo].[tasks]
      ADD CONSTRAINT [tasks_parentTaskId_fkey]
      FOREIGN KEY ([parentTaskId]) REFERENCES [dbo].[tasks]([id])
      ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH

