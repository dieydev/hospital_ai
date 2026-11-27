using System;
using System.Data;
using System.Data.Common;
using Microsoft.Data.SqlClient;

namespace HospitalAI.Tests;

/// <summary>
/// Guard cô lập kết nối SQL Server cho bộ kiểm thử Vòng 2B (FIX-02).
/// Áp dụng cơ chế fail-closed: bắt buộc đọc từ HOSPITALAI_TEST_SQL_CONN,
/// chỉ chấp nhận instance .\SQLEXPRESS01 và database HospitalAI_TestDB,
/// tuyệt đối không fallback về cơ sở dữ liệu làm việc HospitalAI_DB.
/// </summary>
public static class IsolatedSqlTestConnectionGuard
{
    public const string ConnectionEnvVar = "HOSPITALAI_TEST_SQL_CONN";
    public const string AllowedDataSource = @".\SQLEXPRESS01";
    public const string AllowedInstanceName = "SQLEXPRESS01";
    public const string AllowedDatabaseName = "HospitalAI_TestDB";

    public static string ResolveAndValidate(string? overrideConnectionString = null)
    {
        var rawConn = overrideConnectionString ?? Environment.GetEnvironmentVariable(ConnectionEnvVar);
        if (string.IsNullOrWhiteSpace(rawConn))
        {
            throw new InvalidOperationException(
                $"Thiếu biến môi trường '{ConnectionEnvVar}'. Bộ kiểm thử từ chối chạy theo cơ chế fail-closed để bảo vệ cơ sở dữ liệu làm việc.");
        }

        SqlConnectionStringBuilder builder;
        try
        {
            builder = new SqlConnectionStringBuilder(rawConn);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Chuỗi kết nối '{ConnectionEnvVar}' không hợp lệ: {ex.Message}", ex);
        }

        if (!string.IsNullOrWhiteSpace(builder.AttachDBFilename))
        {
            throw new InvalidOperationException(
                "Từ chối cấu hình AttachDBFilename trong chuỗi kết nối kiểm thử.");
        }

        var dataSource = builder.DataSource?.Trim() ?? string.Empty;
        if (!string.Equals(dataSource, AllowedDataSource, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Từ chối kết nối tới Data Source '{dataSource}'. Kiểm thử cô lập chỉ cho phép instance '{AllowedDataSource}'.");
        }

        var database = builder.InitialCatalog?.Trim() ?? string.Empty;
        if (!string.Equals(database, AllowedDatabaseName, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Từ chối kết nối tới Database '{database}'. Kiểm thử cô lập chỉ cho phép database '{AllowedDatabaseName}'.");
        }

        return builder.ConnectionString;
    }

    public static void VerifyConnectedTargetBeforeWrite(DbConnection connection, DbTransaction? transaction = null)
    {
        if (connection == null)
        {
            throw new ArgumentNullException(nameof(connection));
        }

        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }

        using var cmd = connection.CreateCommand();
        cmd.Transaction = transaction;
        cmd.CommandText = "SELECT CAST(SERVERPROPERTY('InstanceName') AS NVARCHAR(128)) AS InstanceName, DB_NAME() AS DatabaseName;";
        cmd.CommandType = CommandType.Text;

        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
        {
            throw new InvalidOperationException("Không thể đọc metadata instance/database thực tế sau khi mở kết nối SQL Server.");
        }

        var actualInstance = reader.IsDBNull(0) ? string.Empty : reader.GetString(0).Trim();
        var actualDatabase = reader.IsDBNull(1) ? string.Empty : reader.GetString(1).Trim();

        ValidateObservedTarget(actualInstance, actualDatabase);
    }

    public static void ValidateObservedTarget(string? actualInstance, string? actualDatabase)
    {
        if (!string.Equals(actualInstance?.Trim(), AllowedInstanceName, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(actualDatabase?.Trim(), AllowedDatabaseName, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Chặn thao tác ghi SQL Server: đích kết nối thực tế là instance='{actualInstance}', database='{actualDatabase}', không khớp '{AllowedInstanceName}' / '{AllowedDatabaseName}'.");
        }
    }
}
