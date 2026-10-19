using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HospitalAI.Infrastructure.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var traceId = context.TraceIdentifier;
            _logger.LogError(ex, "[GlobalExceptionHandler] Lỗi nghiêm trọng khi xử lý {Method} {Path} (TraceId: {TraceId})", context.Request.Method, context.Request.Path, traceId);

            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                var isDev = _env.IsDevelopment();
                var errorResponse = new
                {
                    status = 500,
                    message = isDev
                        ? ex.Message
                        : "Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ kỹ thuật.",
                    errorDetails = isDev ? ex.StackTrace : null,
                    traceId = traceId,
                    timestamp = DateTime.UtcNow
                };

                var json = JsonSerializer.Serialize(errorResponse);
                await context.Response.WriteAsync(json);
            }
        }
    }
}

public static class GlobalExceptionHandlerExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    }
}
