
using chat.Models;
using chat.Services;
using Microsoft.AspNetCore.SignalR;

namespace chat.Hubs;

public interface IChatClient
{
    public Task ReceiveMessage(string userName, string message);
    public Task ReceiveMessageHistory(List<ChatMessage> messageHistory);
}

public class ChatHub(IChatMessageService messageService, ILogger<ChatHub> logger)
    : Hub<IChatClient>
{
    private static readonly Dictionary<string, UserConnection> Users = new Dictionary<string, UserConnection>();

    public async Task JoinChat(UserConnection connection)
    {
        try
        {
            // Store the user connection
            Users[Context.ConnectionId] = connection;

            // Add to the group
            await Groups.AddToGroupAsync(Context.ConnectionId, connection.ChatRoom);
            
            // Get message history from Redis
            var messageHistory = await messageService.GetChatHistoryAsync(connection.ChatRoom);
            
            // Send message history to the new user
            await Clients.Caller.ReceiveMessageHistory(messageHistory);
            
            // Create join message
            var joinMessage = new ChatMessage("Система", $"{connection.UserName} присоединился к чату");
            
            // Add join message to Redis
            await messageService.AddMessageAsync(connection.ChatRoom, joinMessage);
            
            // Send welcome message to all users in the room
            await Clients.Group(connection.ChatRoom)
                .ReceiveMessage(joinMessage.UserName, joinMessage.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in JoinChat");
        }
    }

    public async Task SendMessage(string message)
    {
        try
        {
            if (Users.TryGetValue(Context.ConnectionId, out var connection))
            {
                // Create chat message
                var chatMessage = new ChatMessage(connection.UserName, message);
                
                // Add to Redis
                await messageService.AddMessageAsync(connection.ChatRoom, chatMessage);
                
                // Send to all clients in the group
                await Clients.Group(connection.ChatRoom)
                    .ReceiveMessage(chatMessage.UserName, chatMessage.Message);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in SendMessage");
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            if (Users.TryGetValue(Context.ConnectionId, out var connection))
            {
                // Create leave message
                var leaveMessage = new ChatMessage("Система", $"{connection.UserName} покинул чат");
                
                // Add to Redis
                await messageService.AddMessageAsync(connection.ChatRoom, leaveMessage);
                
                // Send to all clients
                await Clients.Group(connection.ChatRoom)
                    .ReceiveMessage(leaveMessage.UserName, leaveMessage.Message);
                
                Users.Remove(Context.ConnectionId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in OnDisconnectedAsync");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}