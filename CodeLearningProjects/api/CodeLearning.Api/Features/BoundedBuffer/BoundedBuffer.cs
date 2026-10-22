namespace CodeLearning.Api.Features.BoundedBuffer;

public class BoundedBuffer<T>
{
    private readonly Queue<T> _queue = new();
    private readonly int _capacity;
    private readonly object _lock = new();

    public BoundedBuffer(int capacity)
    {
        if (capacity < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity), "Capacity must be at least 1.");
        }

        _capacity = capacity;
    }

    public int Capacity
    {
        get
        {
            lock (_lock)
            {
                return _capacity;
            }
        }
    }

    public void Put(T item)
    {
        lock (_lock)
        {
            while (_queue.Count >= _capacity)
            {
                Monitor.Wait(_lock);
            }

            _queue.Enqueue(item);
            Monitor.PulseAll(_lock);
        }
    }

    public T Take()
    {
        lock (_lock)
        {
            while (_queue.Count == 0)
            {
                Monitor.Wait(_lock);
            }

            var item = _queue.Dequeue();
            Monitor.PulseAll(_lock);
            return item;
        }
    }

    public int Size
    {
        get
        {
            lock (_lock)
            {
                return _queue.Count;
            }
        }
    }

    public T[] Snapshot()
    {
        lock (_lock)
        {
            return _queue.ToArray();
        }
    }
}
