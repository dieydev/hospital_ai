using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Giới hạn dung lượng tải lên tối đa 25MB (Phù hợp tài liệu/ảnh y tế, chống DoS cạn kiệt RAM)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 25 * 1024 * 1024;
});

// Giới hạn Timeout 60s cho mỗi Request để chống Slowloris attack
builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(60)
    };
});

// Rate Limiting phân tách theo từng Client IP: 150 requests / phút / IP
static string ResolveClientIp(HttpContext ctx)
{
    var forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
    if (!string.IsNullOrWhiteSpace(forwarded))
    {
        var firstIp = forwarded.Split(',')[0].Trim();
        if (!string.IsNullOrEmpty(firstIp)) return firstIp;
    }
    return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/health", StringComparison.OrdinalIgnoreCase))
        {
            return RateLimitPartition.GetNoLimiter("health");
        }

        var clientIp = ResolveClientIp(httpContext);
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 150,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 10
        });
    });
});

// Cấu hình CORS bảo mật: Giới hạn HTTP methods cần thiết, cấm wildcard AllowAnyOrigin tùy tiện trong Production
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("HospitalCorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// Thêm các Security Headers chuẩn OWASP chống XSS, MIME-sniffing, Clickjacking, và Feature abuse
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    await next();
});

app.UseRequestTimeouts();
app.UseCors("HospitalCorsPolicy");
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Gateway = "HospitalAI.Gateway", Timestamp = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { Status = "Healthy", Gateway = "HospitalAI.Gateway", Timestamp = DateTime.UtcNow }));

app.MapReverseProxy();

app.Run();
