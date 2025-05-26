
using chat.Models;
using chat.Services;
using Microsoft.AspNetCore.SignalR;

namespace chat.Hubs;

public interface IChatClient
{
    public Task ReceiveMessage(string userName, string message);
    public Task ReceiveMessageHistory(List<ChatMessage> messageHistory);
    public Task UsersInRoom(List<string> users);
}

public class ChatHub(IChatMessageService messageService, ILogger<ChatHub> logger)
    : Hub<IChatClient>
{
    private static readonly Dictionary<string, UserConnection> Users = new Dictionary<string, UserConnection>();

    public async Task JoinChat(UserConnection connection)
    {
        try
        {
            
            Users[Context.ConnectionId] = connection;

            // добавляем к группе пользователей
            await Groups.AddToGroupAsync(Context.ConnectionId, connection.ChatRoom);
            
            // получаем сообщения используя Redis
            var messageHistory = await messageService.GetChatHistoryAsync(connection.ChatRoom);
            
            // Отправляем все предыдущие сообщения пользователю
            await Clients.Caller.ReceiveMessageHistory(messageHistory);
            
            // создаем уведомление о присоеденении нового опльзователя
            var joinMessage = new ChatMessage("Система", $"{connection.UserName} присоединился к чату");
            
            // отправляем сообщение на Redis
            await messageService.AddMessageAsync(connection.ChatRoom, joinMessage);
            
            // отправляем сообщения в чате
            await Clients.Group(connection.ChatRoom)
                .ReceiveMessage(joinMessage.UserName, joinMessage.Message);
                
            // Send updated user list to all clients in the room
            await SendUsersInRoom(connection.ChatRoom);
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
                // cоздание сообщения
                var chatMessage = new ChatMessage(connection.UserName, message);
                
                // кеширование в Redis
                await messageService.AddMessageAsync(connection.ChatRoom, chatMessage);
                
                // обновление списка сообщений
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
                
                // Send updated user list to all clients in the room
                await SendUsersInRoom(connection.ChatRoom);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in OnDisconnectedAsync");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
    
    // Helper method to send the current users in a room
    private async Task SendUsersInRoom(string roomName)
    {
        try
        {
            // Get all users in the specified room
            var usersInRoom = Users
                .Where(u => u.Value.ChatRoom == roomName)
                .Select(u => u.Value.UserName)
                .ToList();
                
            // Send the list to all clients in the room
            await Clients.Group(roomName).UsersInRoom(usersInRoom);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in SendUsersInRoom");
        }
    }
}