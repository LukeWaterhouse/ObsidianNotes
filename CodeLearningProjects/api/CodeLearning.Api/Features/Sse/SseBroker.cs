using System.Collections.Concurrent;
using System.Threading.Channels;

namespace CodeLearning.Api.Features.Sse;

public sealed class SseBroker
{
    private readonly ConcurrentDictionary<Guid, ChannelWriter<string>> _clients = new();

    public Guid Subscribe(out ChannelReader<string> reader)
    {
        var channel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });

        var id = Guid.NewGuid();
        _clients[id] = channel.Writer;
        reader = channel.Reader;
        return id;
    }

    public void Unsubscribe(Guid id)
    {
        if (_clients.TryRemove(id, out var writer))
        {
            writer.TryComplete();
        }
    }

    public int Broadcast(string message)
    {
        var delivered = 0;
        foreach (var client in _clients.Values)
        {
            if (client.TryWrite(message))
            {
                delivered++;
            }
        }

        return delivered;
    }
}
