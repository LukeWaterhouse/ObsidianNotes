using Microsoft.AspNetCore.Mvc;

namespace CodeLearning.Api.Features.BoundedBuffer;

[ApiController]
[Route("api/[controller]")]
public class BufferController(BoundedBuffer<string> buffer) : ControllerBase
{
    [HttpGet]
    public IActionResult GetState()
    {
        return Ok(ToSnapshotResponse());
    }

    [HttpPost("put")]
    public async Task<IActionResult> Put([FromBody] PutRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body?.Value))
        {
            return BadRequest(new { error = "value is required" });
        }

        var value = body.Value.Trim();
        await Task.Run(() => buffer.Put(value), cancellationToken);
        return Ok(ToSnapshotResponse());
    }

    [HttpPost("take")]
    public async Task<IActionResult> Take(CancellationToken cancellationToken)
    {
        var item = await Task.Run(() => buffer.Take(), cancellationToken);
        var snapshot = ToSnapshotResponse();
        return Ok(new TakeResponse(item, snapshot.Capacity, snapshot.Size, snapshot.Items));
    }

    private BufferSnapshotResponse ToSnapshotResponse()
    {
        return new BufferSnapshotResponse(buffer.Capacity, buffer.Size, buffer.Snapshot());
    }

    public sealed record PutRequest(string? Value);

    public sealed record BufferSnapshotResponse(int Capacity, int Size, string[] Items);

    public sealed record TakeResponse(string Item, int Capacity, int Size, string[] Items);
}
