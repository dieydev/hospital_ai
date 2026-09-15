using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using HospitalAI.Infrastructure.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace HospitalAI.ExaminationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly HospitalDbContext _dbContext;

        public PaymentController(IPaymentService paymentService, HospitalDbContext dbContext)
        {
            _paymentService = paymentService;
            _dbContext = dbContext;
        }

        [HttpPost("create-payment-url")]
        public IActionResult CreatePaymentUrl([FromBody] PaymentInformationModel model)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var url = _paymentService.CreatePaymentUrl(model, ipAddress);
            return Ok(new { Url = url });
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> PaymentCallback()
        {
            var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            var response = _paymentService.ValidateSignature(dict);
            if (!response)
            {
                return BadRequest(new { Message = "Chữ ký không hợp lệ" });
            }

            var vnp_ResponseCode = Request.Query["vnp_ResponseCode"].ToString();
            var vnp_TxnRef = Request.Query["vnp_TxnRef"].ToString();

            if (vnp_ResponseCode == "00")
            {
                if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
                {
                    var billing = await _dbContext.Billings
                        .Include(b => b.Items)
                        .FirstOrDefaultAsync(b => b.Id == billingId);

                    if (billing != null && billing.Status != "Paid")
                    {
                        billing.Status = "Paid";
                        billing.PaidAt = DateTime.UtcNow;
                        billing.PaymentMethod = "VNPay";
                        billing.TransactionRef = vnp_TxnRef;

                        // Logic update according to billing type
                        if (billing.BillingType == "ServiceOrder")
                        {
                            var item = billing.Items.FirstOrDefault();
                            if (item != null && item.ReferenceId.HasValue)
                            {
                                var serviceOrder = await _dbContext.ServiceOrders.FirstOrDefaultAsync(s => s.Id == item.ReferenceId.Value);
                                if (serviceOrder != null) serviceOrder.Status = "Paid";
                            }
                        }
                        else if (billing.BillingType == "Registration")
                        {
                            // Could update QueueTicket status or something else if needed
                        }

                        await _dbContext.SaveChangesAsync();
                    }
                }
                
                // Return custom page or redirect to mobile app deep link
                return Ok(new { Message = "Thanh toán thành công", OrderId = vnp_TxnRef, Success = true });
            }
            
            return BadRequest(new { Message = "Thanh toán thất bại hoặc bị hủy", Success = false });
        }
    }
}
