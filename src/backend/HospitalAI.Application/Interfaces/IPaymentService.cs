using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace HospitalAI.Application.Interfaces;

public class PaymentInformationModel
{
    public string OrderId { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string OrderDescription { get; set; } = string.Empty;
}

public interface IPaymentService
{
    string CreatePaymentUrl(PaymentInformationModel model, HttpContext context);
    bool ValidateSignature(IQueryCollection collections);
}
