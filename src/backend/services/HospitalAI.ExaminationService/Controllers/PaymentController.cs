using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using HospitalAI.Infrastructure.Data;
using System.Linq;

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
            var url = _paymentService.CreatePaymentUrl(model, HttpContext);
            return Ok(new { Url = url });
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> PaymentCallback()
        {
            var response = _paymentService.ValidateSignature(Request.Query);
            if (!response)
            {
                return BadRequest(new { Message = "Chữ ký không hợp lệ" });
            }

            var vnp_ResponseCode = Request.Query["vnp_ResponseCode"].ToString();
            var vnp_TxnRef = Request.Query["vnp_TxnRef"].ToString();

            if (vnp_ResponseCode == "00")
            {
                // Thanh toán thành công, cập nhật trạng thái lịch khám / Examination thành "Paid"
                if (Guid.TryParse(vnp_TxnRef, out Guid examId))
                {
                    var exam = _dbContext.Examinations.FirstOrDefault(e => e.Id == examId);
                    if (exam != null)
                    {
                        exam.Status = "Paid";
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
