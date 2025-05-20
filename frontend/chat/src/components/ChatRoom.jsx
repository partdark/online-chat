import React, { useState, useRef, useEffect } from "react";

export const ChatRoom = ({ messages, sendMessage, leaveChat, roomName }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle leave chat with confirmation
  const handleLeaveChat = () => {
    if (window.confirm("Вы уверены, что хотите покинуть чат?")) {
      leaveChat();
    }
  };

  // Render messages with CSS classes
  const renderMessages = () => {
    // Only render the last 50 messages for performance
    const messagesToRender = messages.length > 50 
      ? messages.slice(messages.length - 50) 
      : messages;
    
    return messagesToRender.map((msg, index) => (
      <div 
        key={index} 
        className={`message ${msg.userName === "Admin" ? "message-admin" : "message-user"}`}
      >
        <div className="message-header">
          <span className={`username ${msg.userName === "Admin" ? "username-admin" : "username-user"}`}>
            {msg.userName}
          </span>
          <span className="timestamp">
            {msg.timestamp || ""}
          </span>
        </div>
        <div className="message-content">{msg.message}</div>
      </div>
    ));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        <h2 className="chat-header">Комната чата: {roomName}</h2>
        
        <div 
          ref={messageListRef}
          className="chat-messages"
        >
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="message-form">
          <input 
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
          />
          <button type="submit" className="send-button">Отправить</button>
        </form>
        
        <button 
          onClick={handleLeaveChat} 
          className="leave-button"
        >Отключиться</button>
      </div>
    </div>
  );
};