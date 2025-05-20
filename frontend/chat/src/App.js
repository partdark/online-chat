import React, { useState } from "react";
import { WaitingRoom } from "./components/WaitingRoom";
import { ChatRoom } from "./components/ChatRoom";
import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import "./index.css";

function App() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("");

  // Define message handlers outside of joinChat
  const handleReceiveMessage = (userName, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prevMessages => [...prevMessages, { userName, message, timestamp }]);
  };

  const handleMessageHistory = (messageHistory) => {
    const formattedMessages = messageHistory.map(msg => ({
      userName: msg.userName,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString()
    }));
    setMessages(formattedMessages);
  };

  const joinChat = async (userName, chatRoom) => {
    try {
      // Get backend URL from environment or use default
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5082/chat";
      
      // Optimize connection settings
      const newConnection = new HubConnectionBuilder()
        .withUrl(backendUrl, {
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 1000, 5000, null])
        .configureLogging(LogLevel.Warning) // Reduce logging
        .build();

      // Handle individual messages
      newConnection.on("ReceiveMessage", handleReceiveMessage);

      // Handle message history
      newConnection.on("ReceiveMessageHistory", handleMessageHistory);

      await newConnection.start();
      
      await newConnection.invoke("JoinChat", { userName, chatRoom });
      
      setConnection(newConnection);
      setCurrentRoom(chatRoom);
      setConnected(true);
    }
    catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect to chat server. See console for details.");
    }
  };

  const sendMessage = async (message) => {
    try {
      if (connection) {
        await connection.invoke("SendMessage", message);
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const leaveChat = async () => {
    try {
      if (connection) {
        await connection.stop();
        setConnection(null);
        setConnected(false);
        setCurrentRoom("");
        setMessages([]);
      }
    } catch (error) {
      console.error("Leave chat error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" style={{ padding: '0 10%' }}>
      <div className="container">
        {!connected ? (
          <WaitingRoom joinChat={joinChat} />
        ) : (
          <ChatRoom 
            messages={messages} 
            sendMessage={sendMessage} 
            leaveChat={leaveChat}
            roomName={currentRoom}
          />
        )}
      </div>
    </div>
  );
}

export default App;