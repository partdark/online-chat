import React, { useState, useEffect } from "react";

export const WaitingRoom = ({joinChat, initialUserName = "", initialRoomName = ""}) => {
    const [userName, setUserName] = useState(initialUserName);
    const [roomName, setRoomName] = useState(initialRoomName);
    const [error, setError] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        
        
        if (!userName.trim()) {
            setError("Имя пользователя не может быть пустым");
            return;
        }
        
      
        if (!roomName.trim()) {
            setError("Название чата не может быть пустым");
            return;
        }
        
        // Clear any previous errors
        setError("");
        
        
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