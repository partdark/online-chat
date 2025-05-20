using chat.Models;

namespace chat.Services;

/// <summary>
/// Redis-based chat message service interface
/// </summary>
public interface IChatMessageService
{
    Task<List<ChatMessage>> GetChatHistoryAsync(string chatRoom);
    Task AddMessageAsync(string chatRoom, ChatMessage message);
}