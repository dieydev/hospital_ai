using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using HospitalAI.Domain.Entities;

namespace HospitalAI.Infrastructure.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration.GetSection("MongoDb:ConnectionString").Value;
        var databaseName = configuration.GetSection("MongoDb:DatabaseName").Value;

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<MongoAILog> AILogs => _database.GetCollection<MongoAILog>("AILogs");
}
