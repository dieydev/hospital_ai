var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("AllowAll");

app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Gateway = "HospitalAI.Gateway", Timestamp = DateTime.UtcNow }));

app.MapReverseProxy();

app.Run();
