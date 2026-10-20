using Microsoft.AspNetCore.Mvc;

namespace CodeLearning.Api.Features.Sse;

[ApiController]
[Route("api/[controller]")]
public class SseController(SseBroker broker) : ControllerBase
{
    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        var clientId = broker.Subscribe(out var reader);

        try
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            Response.Headers.Connection = "keep-alive";
            Response.Headers.Append("X-Accel-Buffering", "no");

            await Response.WriteAsync(": connected\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            await foreach (var message in reader.ReadAllAsync(cancellationToken))
            {
                await Response.WriteAsync($"data: {message}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        finally
        {
            broker.Unsubscribe(clientId);
        }
    }

    [HttpPost("trigger")]
    public IActionResult Trigger([FromBody] TriggerRequest? body)
    {
        var message = string.IsNullOrWhiteSpace(body?.Message)
            ? $"Event at {DateTimeOffset.UtcNow:O}"
            : body.Message.Trim();

        var delivered = broker.Broadcast(message);
        return Ok(new TriggerResponse(delivered, message));
    }

    public sealed record TriggerRequest(string? Message);

    public sealed record TriggerResponse(int Delivered, string Message);
}
