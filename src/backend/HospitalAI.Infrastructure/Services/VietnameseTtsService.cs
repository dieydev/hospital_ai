using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace HospitalAI.Infrastructure.Services;

/// <summary>
/// Dịch vụ tổng hợp giọng nói Tiếng Việt (audio/mpeg) phục vụ loa phát thanh Gọi số Hàng chờ & Kiosk,
/// đảm bảo phát được Tiếng Việt trên mọi trình duyệt (kể cả máy chưa cài gói giọng vi-VN trên Windows).
/// </summary>
public class VietnameseTtsService
{
    public const int MaxTextLength = 350;
    public const int DefaultMaxChunkLength = 180;
    public const string HttpClientName = "VietnameseTts";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _memoryCache;

    public VietnameseTtsService(IHttpClientFactory httpClientFactory, IMemoryCache memoryCache)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
    }

    /// <summary>
    /// Chuẩn hóa khoảng trắng, loại bỏ ký tự điều khiển và kiểm tra giới hạn độ dài văn bản đọc loa.
    /// </summary>
    public static string NormalizeAndValidateText(string? rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            throw new ArgumentException("Nội dung cần phát loa không được để trống.", nameof(rawText));

        var cleanedChars = rawText
            .Select(ch => char.IsControl(ch) ? ' ' : ch)
            .ToArray();
        var normalized = Regex.Replace(new string(cleanedChars).Trim(), @"\s+", " ");

        if (string.IsNullOrWhiteSpace(normalized))
            throw new ArgumentException("Nội dung cần phát loa không được để trống.", nameof(rawText));

        if (normalized.Length > MaxTextLength)
            throw new ArgumentException($"Nội dung phát loa tối đa {MaxTextLength} ký tự.", nameof(rawText));

        return normalized;
    }

    /// <summary>
    /// Tách câu thông báo dài thành từng đoạn ngắn <= maxChunkLength tại dấu câu hoặc khoảng trắng.
    /// </summary>
    public static IReadOnlyList<string> SplitIntoChunks(string normalizedText, int maxChunkLength = DefaultMaxChunkLength)
    {
        if (string.IsNullOrWhiteSpace(normalizedText))
            return Array.Empty<string>();

        if (maxChunkLength < 20)
            throw new ArgumentOutOfRangeException(nameof(maxChunkLength), "Độ dài mỗi đoạn tối thiểu 20 ký tự.");

        var remaining = normalizedText.Trim();
        var chunks = new List<string>();

        while (remaining.Length > maxChunkLength)
        {
            var window = remaining.AsSpan(0, maxChunkLength);
            var splitIdx = -1;

            // Ưu tiên tách ở dấu ngắt câu gần cuối đoạn
            for (var i = window.Length - 1; i >= maxChunkLength / 3; i--)
            {
                if (window[i] is '.' or ';' or '!' or '?' or ',')
                {
                    splitIdx = i + 1;
                    break;
                }
            }

            // Nếu không có dấu câu, tách ở khoảng trắng gần nhất
            if (splitIdx <= 0)
            {
                for (var i = window.Length - 1; i > 0; i--)
                {
                    if (char.IsWhiteSpace(window[i]))
                    {
                        splitIdx = i;
                        break;
                    }
                }
            }

            if (splitIdx <= 0)
                splitIdx = maxChunkLength;

            var piece = remaining.Substring(0, splitIdx).Trim();
            if (piece.Length > 0)
                chunks.Add(piece);

            remaining = remaining.Substring(splitIdx).Trim();
        }

        if (remaining.Length > 0)
            chunks.Add(remaining);

        return chunks;
    }

    /// <summary>
    /// Nối các đoạn MP3 một cách an toàn (gỡ header ID3v2 dư thừa từ đoạn thứ 2 trở đi nếu có).
    /// </summary>
    public static byte[] MergeMp3Chunks(IReadOnlyList<byte[]> segments)
    {
        if (segments.Count == 0)
            return Array.Empty<byte>();
        if (segments.Count == 1)
            return segments[0];

        using var ms = new MemoryStream();
        for (var i = 0; i < segments.Count; i++)
        {
            var data = segments[i];
            if (data == null || data.Length == 0)
                continue;

            var offset = 0;
            if (i > 0 && data.Length >= 10 && data[0] == (byte)'I' && data[1] == (byte)'D' && data[2] == (byte)'3')
            {
                // Kích thước ID3v2 dùng synchsafe integer ở byte 6..9
                var tagSize = ((data[6] & 0x7F) << 21)
                    | ((data[7] & 0x7F) << 14)
                    | ((data[8] & 0x7F) << 7)
                    | (data[9] & 0x7F);
                var candidateOffset = 10 + tagSize;
                if (candidateOffset < data.Length)
                    offset = candidateOffset;
            }

            ms.Write(data, offset, data.Length - offset);
        }

        return ms.ToArray();
    }

    public async Task<byte[]> SynthesizeVietnameseMp3Async(string rawText, CancellationToken ct = default)
    {
        var normalized = NormalizeAndValidateText(rawText);
        var cacheKey = $"vi-tts:{normalized}";

        if (_memoryCache.TryGetValue(cacheKey, out byte[]? cached) && cached is { Length: > 0 })
            return cached;

        var chunks = SplitIntoChunks(normalized, DefaultMaxChunkLength);
        if (chunks.Count > 4)
            throw new ArgumentException("Nội dung phát loa quá dài.");

        var client = _httpClientFactory.CreateClient(HttpClientName);
        var segments = new List<byte[]>(chunks.Count);

        foreach (var chunk in chunks)
        {
            // URL cố định tới Google Translate TTS Tiếng Việt — không cho phép client truyền URL/ngôn ngữ tùy ý (chống SSRF)
            var ttsUrl = $"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q={Uri.EscapeDataString(chunk)}";
            using var request = new HttpRequestMessage(HttpMethod.Get, ttsUrl);
            request.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0");

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Dịch vụ TTS phản hồi mã lỗi {(int)response.StatusCode}.");
            }

            var mediaType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
            if (mediaType.Contains("html", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Dịch vụ TTS trả về dữ liệu không phải âm thanh.");
            }

            var bytes = await response.Content.ReadAsByteArrayAsync(ct);
            if (bytes.Length < 64)
            {
                throw new InvalidOperationException("Dữ liệu âm thanh TTS rỗng.");
            }

            segments.Add(bytes);
        }

        var merged = MergeMp3Chunks(segments);
        if (merged.Length > 0)
        {
            _memoryCache.Set(cacheKey, merged, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });
        }

        return merged;
    }
}
