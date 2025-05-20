using chat.Models;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System.Collections.Concurrent;

namespace chat.Services;

public class RedisChatMessageService : IChatMessageService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisChatMessageService> _logger;
    
    // Serialization settings for better performance
    private readonly JsonSerializerSettings _serializerSettings = new()
    {
        TypeNameHandling = TypeNameHandling.None,
        NullValueHandling = NullValueHandling.Ignore
    };
    
    // Flag to track Redis availability
    private bool _redisAvailable = true;
    private DateTime _nextRedisRetry = DateTime.UtcNow;
    private readonly TimeSpan _redisRetryInterval = TimeSpan.FromMinutes(1);

    public RedisChatMessageService(IDistributedCache cache, ILogger<RedisChatMessageService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<ChatMessage>> GetChatHistoryAsync(string chatRoom)
    {
        try
        {
            // Get from Redis
            var cachedHistory = await _cache.GetStringAsync($"chat:{chatRoom}:history");
            
            if (string.IsNullOrEmpty(cachedHistory))
            {
                return new List<ChatMessage>();
            }
            
            var messages = JsonConvert.DeserializeObject<List<ChatMessage>>(cachedHistory, _serializerSettings) 
                ?? new List<ChatMessage>();
            
            // Redis is working
            _redisAvailable = true;
            
            return messages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chat history from Redis");
            
            // Mark Redis as unavailable and set retry time
            _redisAvailable = false;
            _nextRedisRetry = DateTime.UtcNow.Add(_redisRetryInterval);
            
            // Return empty list if Redis fails
            return new List<ChatMessage>();
        }
    }

    public async Task AddMessageAsync(string chatRoom, ChatMessage message)
    {
        try
        {
            // Get current messages
            var messages = await GetChatHistoryAsync(chatRoom);
            
            // Add new message
            messages.Add(message);
            
            // Keep only the last 50 messages to improve performance
            if (messages.Count > 50)
            {
                messages = messages.Skip(messages.Count - 50).ToList();
            }
            
            // Only try Redis if it's available or retry time has passed
            if (_redisAvailable || DateTime.UtcNow >= _nextRedisRetry)
            {
                // Save to Redis with a 24-hour expiration
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                };
                
                await _cache.SetStringAsync(
                    $"chat:{chatRoom}:history",
                    JsonConvert.SerializeObject(messages, _serializerSettings),
                    options
                );
                
                // Redis is working
                _redisAvailable = true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving message to Redis");
            
            // Mark Redis as unavailable and set retry time
            _redisAvailable = false;
            _nextRedisRetry = DateTime.UtcNow.Add(_redisRetryInterval);
        }
    }
}