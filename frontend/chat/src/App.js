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
  const [lastUserName, setLastUserName] = useState("");
  const [lastRoomName, setLastRoomName] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);

  // Define message handlers outside of joinChat
  const handleReceiveMessage = (userName, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prevMessages => [...prevMessages, { userName, message, timestamp }]);
  };

  const handleMessageHistory = (messageHistory) => {
    const formattedMessages = messageHistory.map(msg => {
      // Check if timestamp is valid before creating a Date object
      let timestamp;
      try {
        // Handle both string timestamps and numeric timestamps
        timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "";
        // Check if the result is valid
        if (timestamp === "Invalid Date") {
          timestamp = "";
        }
      } catch (error) {
        console.error("Error parsing timestamp:", error);
        timestamp = "";
      }
      
      return {
        userName: msg.userName,
        message: msg.message,
        timestamp: timestamp
      };
    });
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
      
      // Handle user list updates
      newConnection.on("UsersInRoom", (users) => {
        setActiveUsers(users);
      });

      await newConnection.start();
      
      await newConnection.invoke("JoinChat", { userName, chatRoom });
      
      setConnection(newConnection);
      setCurrentRoom(chatRoom);
      setLastUserName(userName);
      setLastRoomName(chatRoom);
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
          <WaitingRoom 
            joinChat={joinChat} 
            initialUserName={lastUserName} 
            initialRoomName={lastRoomName} 
          />
        ) : (
          <ChatRoom 
            messages={messages} 
            sendMessage={sendMessage} 
            leaveChat={leaveChat}
            roomName={currentRoom}
            activeUsers={activeUsers}
          />
        )}
      </div>
    </div>
  );
}

export default App;