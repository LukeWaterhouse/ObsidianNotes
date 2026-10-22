using CodeLearning.Api.Features.BoundedBuffer;
using CodeLearning.Api.Features.Sse;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<SseBroker>();
builder.Services.AddSingleton(new BoundedBuffer<string>(3));
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();
app.MapControllers();

app.Run();
