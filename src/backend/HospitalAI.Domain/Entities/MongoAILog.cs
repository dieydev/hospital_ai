using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HospitalAI.Domain.Entities;

public class MongoAILog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [BsonElement("userRole")]
    public string UserRole { get; set; } = string.Empty;

    [BsonElement("doctorName")]
    public string DoctorName { get; set; } = string.Empty;

    [BsonElement("actionType")]
    public string ActionType { get; set; } = string.Empty; // CHAT_ASSISTANT, ICD10_SUGGESTION, DRUG_SAFETY_CHECK, EMR_SUMMARY

    [BsonElement("modelUsed")]
    public string ModelUsed { get; set; } = string.Empty;

    [BsonElement("promptText")]
    public string PromptText { get; set; } = string.Empty;

    [BsonElement("responseText")]
    public string ResponseText { get; set; } = string.Empty;

    [BsonElement("latencyMs")]
    public int LatencyMs { get; set; }

    [BsonElement("piiRedacted")]
    public bool PiiRedacted { get; set; }

    [BsonElement("redactedCategories")]
    public List<string>? RedactedCategories { get; set; }

    [BsonElement("sources")]
    public List<string>? Sources { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "SUCCESS"; // SUCCESS, WARNING, ERROR
}
