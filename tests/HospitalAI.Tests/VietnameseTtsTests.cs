using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace HospitalAI.Tests;

public class VietnameseTtsTests
{
    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public List<Uri> RequestedUris { get; } = new();

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri != null)
                RequestedUris.Add(request.RequestUri);
            return Task.FromResult(_responder(request));
        }
    }

    private static IConfiguration BuildKioskConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Kiosk:Terminals:0:TerminalId"] = "KIOSK-SANH-A-01",
                ["Kiosk:Terminals:0:TerminalName"] = "Kiosk Sảnh A",
                ["Kiosk:Terminals:0:Location"] = "Tầng Trệt",
                ["Kiosk:Terminals:0:ZoneType"] = "Reception",
                ["Kiosk:Terminals:0:Secret"] = "DMED-KIOSK-A01-2026"
            })
            .Build();
    }

    [Fact]
    public void NormalizeAndValidateText_RejectsEmptyAndOversizedInput()
    {
        Assert.Throws<ArgumentException>(() => VietnameseTtsService.NormalizeAndValidateText("   \t\n "));
        Assert.Throws<ArgumentException>(() => VietnameseTtsService.NormalizeAndValidateText(new string('a', VietnameseTtsService.MaxTextLength + 1)));

        var normalized = VietnameseTtsService.NormalizeAndValidateText("  Xin   mời\n bệnh nhân\t số  101  ");
        Assert.Equal("Xin mời bệnh nhân số 101", normalized);
    }

    [Fact]
    public void SplitIntoChunks_PreservesAllWordsUnderMaxLength()
    {
        var sentence = "Xin mời bệnh nhân Nguyễn Thị Thanh Hương, số thứ tự 105, vui lòng di chuyển đến Khoa Tim Mạch, Phòng 301 Tầng 3 để được bác sĩ thăm khám.";
        var chunks = VietnameseTtsService.SplitIntoChunks(sentence, maxChunkLength: 70);

        Assert.True(chunks.Count >= 2);
        Assert.All(chunks, c => Assert.True(c.Length <= 70, $"Chunk too long ({c.Length}): {c}"));
        Assert.Equal(sentence, string.Join(" ", chunks));
    }

    [Fact]
    public void MergeMp3Chunks_StripsId3HeaderFromSubsequentSegments()
    {
        var chunk1 = new byte[] { 0xFF, 0xFB, 0x90, 0x00, 0x11, 0x22 };
        // Chunk 2 has a 10-byte ID3v2 header with 2-byte payload (size=2) followed by MP3 frame bytes
        var chunk2 = new byte[] { (byte)'I', (byte)'D', (byte)'3', 3, 0, 0, 0, 0, 0, 2, 0xAA, 0xBB, 0xFF, 0xFB, 0x90, 0x44 };

        var merged = VietnameseTtsService.MergeMp3Chunks(new[] { chunk1, chunk2 });

        Assert.Equal(new byte[] { 0xFF, 0xFB, 0x90, 0x00, 0x11, 0x22, 0xFF, 0xFB, 0x90, 0x44 }, merged);
    }

    [Fact]
    public async Task SynthesizeVietnameseMp3Async_CallsFixedGoogleTtsAndCachesRepeatedText()
    {
        var fakeMp3 = new byte[128];
        fakeMp3[0] = 0xFF;
        fakeMp3[1] = 0xFB;

        var handler = new StubHttpMessageHandler(_ =>
        {
            var resp = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(fakeMp3)
            };
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("audio/mpeg");
            return resp;
        });

        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(VietnameseTtsService.HttpClientName))
            .Returns(() => new HttpClient(handler, disposeHandler: false));

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new VietnameseTtsService(factoryMock.Object, cache);

        var first = await service.SynthesizeVietnameseMp3Async("Mời bệnh nhân   số 102");
        var second = await service.SynthesizeVietnameseMp3Async("Mời bệnh nhân số 102");

        Assert.Equal(fakeMp3, first);
        Assert.Equal(fakeMp3, second);
        Assert.Single(handler.RequestedUris);
        Assert.Equal("translate.google.com", handler.RequestedUris[0].Host);
        Assert.Contains("tl=vi", handler.RequestedUris[0].Query);
    }

    [Fact]
    public async Task SynthesizeVietnameseMp3Async_RejectsHtmlErrorPayload()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            var resp = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("<html>blocked</html>", Encoding.UTF8, "text/html")
            };
            return resp;
        });

        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(VietnameseTtsService.HttpClientName))
            .Returns(() => new HttpClient(handler, disposeHandler: false));

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new VietnameseTtsService(factoryMock.Object, cache);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SynthesizeVietnameseMp3Async("Xin mời bệnh nhân số 103"));
    }

    [Fact]
    public async Task TtsController_RequiresStaffOrPairedKioskAndReturnsMp3ForAuthorizedCaller()
    {
        var fakeMp3 = new byte[128];
        fakeMp3[0] = 0xFF;
        fakeMp3[1] = 0xFB;

        var handler = new StubHttpMessageHandler(_ =>
        {
            var resp = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(fakeMp3)
            };
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("audio/mpeg");
            return resp;
        });

        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(VietnameseTtsService.HttpClientName))
            .Returns(() => new HttpClient(handler, disposeHandler: false));

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new VietnameseTtsService(factoryMock.Object, cache);
        var config = BuildKioskConfig();

        // 1. Anonymous unauthenticated caller without kiosk secret -> 401 Unauthorized
        var anonController = new TtsController(service, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        var anonResult = await anonController.Synthesize("Xin mời bệnh nhân", CancellationToken.None);
        Assert.IsType<UnauthorizedObjectResult>(anonResult);

        // 2. Authenticated Doctor -> 200 FileContentResult(audio/mpeg)
        var doctorCtx = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Doctor")
            }, "TestAuth"))
        };
        var doctorController = new TtsController(service, config)
        {
            ControllerContext = new ControllerContext { HttpContext = doctorCtx }
        };
        var docResult = await doctorController.Synthesize("Mời bệnh nhân vào phòng khám", CancellationToken.None);
        var fileResult = Assert.IsType<FileContentResult>(docResult);
        Assert.Equal("audio/mpeg", fileResult.ContentType);
        Assert.Equal(fakeMp3, fileResult.FileContents);

        // 3. Paired Kiosk terminal without JWT -> 200 FileContentResult(audio/mpeg)
        var kioskCtx = new DefaultHttpContext();
        kioskCtx.Request.Headers["X-Kiosk-Terminal-Id"] = "KIOSK-SANH-A-01";
        kioskCtx.Request.Headers["X-Kiosk-Terminal-Secret"] = "DMED-KIOSK-A01-2026";
        var kioskController = new TtsController(service, config)
        {
            ControllerContext = new ControllerContext { HttpContext = kioskCtx }
        };
        var kioskResult = await kioskController.Synthesize("Mời bệnh nhân vào phòng khám", CancellationToken.None);
        Assert.IsType<FileContentResult>(kioskResult);

        // 4. Empty text by authorized caller -> 400 BadRequest
        var badResult = await kioskController.Synthesize("   ", CancellationToken.None);
        Assert.IsType<BadRequestObjectResult>(badResult);
    }
}
