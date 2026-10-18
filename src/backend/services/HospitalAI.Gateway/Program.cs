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

// Rate Limiting: 150 requests / phút / IP
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("global", opt =>
    {
        opt.PermitLimit = 150;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });
});

// Cấu hình CORS bảo mật: Giới hạn HTTP methods cần thiết, cấm wildcard AllowAnyOrigin tùy tiện trong Production
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:5000" };

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

app.UseRequestTimeouts();
app.UseCors("HospitalCorsPolicy");
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Gateway = "HospitalAI.Gateway", Timestamp = DateTime.UtcNow }));

app.MapReverseProxy();

app.Run();
