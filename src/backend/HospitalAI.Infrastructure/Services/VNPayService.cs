using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace HospitalAI.Infrastructure.Services;

public class VNPayService : IPaymentService
{
    private readonly IConfiguration _configuration;

    public VNPayService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
    {
        var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        var timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);

        var vnp_TmnCode = _configuration["Vnpay:TmnCode"];
        var vnp_HashSecret = _configuration["Vnpay:HashSecret"];
        var vnp_Url = _configuration["Vnpay:BaseUrl"];
        var vnp_ReturnUrl = _configuration["Vnpay:ReturnUrl"];
        var vnp_Command = _configuration["Vnpay:Command"];
        var vnp_Version = _configuration["Vnpay:Version"];

        var vnpayData = new Dictionary<string, string>
        {
            { "vnp_Version", vnp_Version ?? "2.1.0" },
            { "vnp_Command", vnp_Command ?? "pay" },
            { "vnp_TmnCode", vnp_TmnCode! },
            { "vnp_Amount", (model.Amount * 100).ToString() }, 
            { "vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1" },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", model.OrderDescription },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", vnp_ReturnUrl! },
            { "vnp_TxnRef", model.OrderId }
        };

        var sortedData = vnpayData.OrderBy(x => x.Key).ToDictionary(x => x.Key, x => x.Value);
        var queryString = new StringBuilder();
        var hashData = new StringBuilder();

        foreach (var (key, value) in sortedData)
        {
            if (!string.IsNullOrEmpty(value))
            {
                hashData.Append(key).Append('=').Append(WebUtility.UrlEncode(value)).Append('&');
                queryString.Append(key).Append('=').Append(WebUtility.UrlEncode(value)).Append('&');
            }
        }

        if (hashData.Length > 0)
        {
            hashData.Remove(hashData.Length - 1, 1);
            queryString.Remove(queryString.Length - 1, 1);
        }

        var vnp_SecureHash = HmacSHA512(vnp_HashSecret!, hashData.ToString());
        return $"{vnp_Url}?{queryString}&vnp_SecureHash={vnp_SecureHash}";
    }

    public bool ValidateSignature(IQueryCollection collections)
    {
        var vnp_HashSecret = _configuration["Vnpay:HashSecret"];
        var vnp_SecureHash = collections.FirstOrDefault(p => p.Key == "vnp_SecureHash").Value.ToString();

        var vnpayData = collections
            .Where(x => x.Key.StartsWith("vnp_") && x.Key != "vnp_SecureHash" && x.Key != "vnp_SecureHashType")
            .OrderBy(x => x.Key)
            .ToDictionary(x => x.Key, x => x.Value.ToString());

        var hashData = new StringBuilder();
        foreach (var (key, value) in vnpayData)
        {
            if (!string.IsNullOrEmpty(value))
            {
                hashData.Append(key).Append('=').Append(WebUtility.UrlEncode(value)).Append('&');
            }
        }

        if (hashData.Length > 0)
        {
            hashData.Remove(hashData.Length - 1, 1);
        }

        var checkSignature = HmacSHA512(vnp_HashSecret!, hashData.ToString());
        return checkSignature.Equals(vnp_SecureHash, StringComparison.InvariantCultureIgnoreCase);
    }

    private static string HmacSHA512(string key, string inputData)
    {
        var hash = new StringBuilder();
        byte[] keyBytes = Encoding.UTF8.GetBytes(key);
        byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);
        using (var hmac = new HMACSHA512(keyBytes))
        {
            byte[] hashValue = hmac.ComputeHash(inputBytes);
            foreach (var theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }
}
