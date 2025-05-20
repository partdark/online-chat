namespace chat.Models;

public class ChatMessage
{
    public string UserName { get; set; }
    public string Message { get; set; }
    public DateTime Timestamp { get; set; }

    // Default constructor for deserialization
    public ChatMessage()
    {
        UserName = string.Empty;
        Message = string.Empty;
        Timestamp = DateTime.UtcNow;
    }

    public ChatMessage(string userName, string message)
    {
        UserName = userName;
        Message = message;
        Timestamp = DateTime.UtcNow;
    }
}