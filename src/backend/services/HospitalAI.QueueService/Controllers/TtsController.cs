using System;
using System.Threading;
using System.Threading.Tasks;
using HospitalAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace HospitalAI.QueueService.Controllers;

/// <summary>
/// Cung cấp luồng âm thanh MP3 Tiếng Việt (fallback chuẩn xác cho Web Speech API) qua /api/queue/tts.
/// Chấp nhận JWT nhân sự bệnh viện hoặc thiết bị Kiosk đã ghép nối hợp lệ.
/// </summary>
[ApiController]
[Route("api/queue/tts")]
public class TtsController : ControllerBase
{
    private readonly VietnameseTtsService _ttsService;
    private readonly IConfiguration? _configuration;

    public TtsController(VietnameseTtsService ttsService, IConfiguration? configuration = null)
    {
        _ttsService = ttsService ?? throw new ArgumentNullException(nameof(ttsService));
        _configuration = configuration;
    }

    private bool IsAuthorizedSpeakerCaller()
    {
        if (User?.Identity?.IsAuthenticated == true &&
            (User.IsInRole("Admin")
             || User.IsInRole("Doctor")
             || User.IsInRole("Receptionist")
             || User.IsInRole("Triage")
             || User.IsInRole("Nurse")
             || User.IsInRole("Pharmacy")
             || User.IsInRole("Cashier")))
        {
            return true;
        }

        var (isKioskAuthorized, _, _) = KioskTerminalValidator.ValidateRequest(HttpContext?.Request, User, _configuration);
        return isKioskAuthorized;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Synthesize([FromQuery] string? text, CancellationToken ct)
    {
        if (!IsAuthorizedSpeakerCaller())
        {
            return Unauthorized(new { message = "Cần đăng nhập nhân sự hoặc ghép đôi trạm Kiosk để dùng loa phát thanh." });
        }

        try
        {
            var audioBytes = await _ttsService.SynthesizeVietnameseMp3Async(text ?? string.Empty, ct);
            if (Response?.Headers != null)
            {
                Response.Headers.CacheControl = "private, max-age=1800";
            }
            return File(audioBytes, "audio/mpeg");
        }
        catch (ArgumentException argEx)
        {
            return BadRequest(new { message = argEx.Message });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(504, new { message = "Quá thời gian tổng hợp giọng nói Tiếng Việt." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = $"Không thể tổng hợp giọng nói Tiếng Việt: {ex.Message}" });
        }
    }
}
