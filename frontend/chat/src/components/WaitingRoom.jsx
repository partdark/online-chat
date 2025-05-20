import React, { useState } from "react";

export const WaitingRoom = ({joinChat}) => {
    const [userName, setUserName] = useState("");
    const [roomName, setRoomName] = useState("");
    const [error, setError] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        
        // Check for empty username
        if (!userName.trim()) {
            setError("Имя пользователя не может быть пустым");
            return;
        }
        
        // Check for empty room name
        if (!roomName.trim()) {
            setError("Название чата не может быть пустым");
            return;
        }
        
        // Clear any previous errors
        setError("");
        
        // Join the chat
        joinChat(userName.trim(), roomName.trim());
    }
    
    return (
        <form onSubmit={onSubmit} className="waiting-form">
            <h2 className="chat-header">Онлайн чат</h2>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            <div className="form-group">
                <label className="form-label">Имя Пользователя</label>
                <input 
                    className="form-input"
                    onChange={(e) => setUserName(e.target.value)} 
                    name="userName" 
                    placeholder="Введите имя"
                    value={userName}
                />
                {error && !userName.trim() && (
                    <div className="error-message">Обязательное поле</div>
                )}
            </div>
            
            <div className="form-group">
                <label className="form-label">Чат</label>
                <input 
                    className="form-input"
                    onChange={(e) => setRoomName(e.target.value)} 
                    name="roomName" 
                    placeholder="Введите название чата"
                    value={roomName}
                />
                {error && !roomName.trim() && (
                    <div className="error-message">Обязательное поле</div>
                )}
            </div>
            
            <button type="submit" className="join-button">Войти</button>
        </form>
    );
}