using chat.Hubs;
using chat.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    }
);

// Add Redis cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "ChatApp_";
});

// Add Redis chat message service as singleton
builder.Services.AddSingleton<IChatMessageService, RedisChatMessageService>();

// Configure SignalR with optimized settings
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 102400; // 100KB
    options.EnableDetailedErrors = true;
    options.StreamBufferCapacity = 20;
});

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors();

app.MapHub<ChatHub>("/chat");

app.Run();