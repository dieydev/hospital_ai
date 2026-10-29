using System;
using System.Collections.Generic;

namespace HospitalAI.Application.DTOs;

public class AnalyzeMedicalImageRequestDto
{
    public string ImageBase64 { get; set; } = string.Empty;
    public string MimeType { get; set; } = "image/jpeg";
    public string Modality { get; set; } = "CHEST_XRAY"; // CHEST_XRAY, BONE_XRAY, CT_SCAN, MRI, LAB_TEST
    public string? ClinicalNote { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
}

public class AnalyzeMedicalImageResponseDto
{
    public string AnalysisTitle { get; set; } = "Kết quả Phân tích Hình ảnh Y khoa (AI Gemini Vision)";
    public string Modality { get; set; } = "CHEST_XRAY";
    public List<string> Findings { get; set; } = new();
    public string SuspectedDiagnosis { get; set; } = string.Empty;
    public string SuggestedICD10 { get; set; } = string.Empty;
    public string SeverityLevel { get; set; } = "NORMAL"; // NORMAL, MILD, MODERATE, SEVERE, CRITICAL
    public int ConfidenceScore { get; set; } = 85; // 0 - 100%
    public string RecommendedNextSteps { get; set; } = string.Empty;
    public string Disclaimers { get; set; } = "Kết quả phân tích do AI gợi ý chỉ mang tính chất hỗ trợ quyết định lâm sàng cho Bác sĩ. Quyết định chẩn đoán cuối cùng thuộc về Bác sĩ điều trị theo luật khám chữa bệnh.";
    public string ModelUsed { get; set; } = string.Empty;
    public int LatencyMs { get; set; }
    public bool Success { get; set; } = true;
}

public class PrescribedMedicineInputDto
{
    public string MedicineName { get; set; } = string.Empty;
    public string? ActiveIngredient { get; set; }
    public string? Dosage { get; set; }
    public string? Unit { get; set; }
}

public class CheckDrugInteractionsRequestDto
{
    public List<PrescribedMedicineInputDto> Medicines { get; set; } = new();
    public string? PatientAllergies { get; set; }
    public string? PatientConditions { get; set; } // Suy thận, suy gan, viêm loét dạ dày, thai kỳ...
}

public class DrugInteractionPairDto
{
    public string DrugA { get; set; } = string.Empty;
    public string DrugB { get; set; } = string.Empty;
    public string Severity { get; set; } = "MODERATE"; // CONTRAINDICATED (Chống chỉ định), HIGH (Nguy hiểm), MODERATE (Thận trọng), MINOR (Nhẹ)
    public string Mechanism { get; set; } = string.Empty; // Cơ chế tương tác
    public string ClinicalEffect { get; set; } = string.Empty; // Hậu quả lâm sàng
    public string ManagementAdvice { get; set; } = string.Empty; // Hướng xử trí đề xuất
}

public class CheckDrugInteractionsResponseDto
{
    public string OverallRisk { get; set; } = "SAFE"; // SAFE, CAUTION, HIGH_RISK, CONTRAINDICATED
    public int RiskScore { get; set; } = 1; // 1-5
    public string SummaryAdvice { get; set; } = string.Empty;
    public List<DrugInteractionPairDto> Interactions { get; set; } = new();
    public List<string> AlternativeSuggestions { get; set; } = new();
    public string ModelUsed { get; set; } = string.Empty;
    public int LatencyMs { get; set; }
    public bool Success { get; set; } = true;
}

