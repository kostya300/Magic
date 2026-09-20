"""
WebSocket менеджер для хранения подключений и отправки уведомлений.
"""
from typing import Dict, Set
from fastapi import WebSocket


class WebSocketManager:
    """Управление WebSocket подключениями пользователей."""
    
    def __init__(self):
        # email -> set(websocket)
        self.user_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, email: str):
        """Подключить пользователя к WebSocket."""
        await websocket.accept()
        if email not in self.user_connections:
            self.user_connections[email] = set()
        self.user_connections[email].add(websocket)
    
    def disconnect(self, websocket: WebSocket, email: str):
        """Отключить пользователя от WebSocket."""
        if email in self.user_connections:
            self.user_connections[email].discard(websocket)
            if not self.user_connections[email]:
                del self.user_connections[email]
    
    async def send_to_user(self, email: str, message: dict):
        """Отправить сообщение конкретному пользователю."""
        if email in self.user_connections:
            disconnected = set()
            for websocket in self.user_connections[email]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
            # Удаляем разорванные подключения
            for ws in disconnected:
                self.disconnect(ws, email)
    
    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключённым пользователям."""
        disconnected = set()
        for email, connections in self.user_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
        # Удаляем разорванные подключения
        for ws in disconnected:
            # Определяем email пользователя (сложнее, но можно через поиск)
            for email, connections in self.user_connections.items():
                if ws in connections:
                    self.disconnect(ws, email)
                    break


# Глобальный экземпляр менеджера
websocket_manager = WebSocketManager()
