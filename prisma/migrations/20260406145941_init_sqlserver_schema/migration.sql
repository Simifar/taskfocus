BEGIN TRY

BEGIN TRAN;

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_userId_status_idx] ON [dbo].[tasks]([userId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_userId_energyLevel_idx] ON [dbo].[tasks]([userId], [energyLevel]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_parentTaskId_idx] ON [dbo].[tasks]([parentTaskId]);

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_parentTaskId_fkey] FOREIGN KEY ([parentTaskId]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
