"""
SmartServe WebSocket Module

Handles WebSocket connections for real-time order tracking,
kitchen notifications, and admin dashboard updates.
"""

import json
import asyncio
from typing import Dict, Set, Any, Optional, Callable
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt

from app.core.config import settings


class WebSocketConnectionManager:
    """
    Manages WebSocket connections and message broadcasting.
    Supports multiple rooms/channels for different user types.
    """

    def __init__(self):
        # Active connections: {user_id: [WebSocket, ...]}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
        # Room-based connections: {room_name: {user_id: WebSocket}}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        
        # Connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        rooms: Optional[list] = None,
        metadata: Optional[Dict] = None,
    ):
        """
        Accept a WebSocket connection and register it.
        
        Args:
            websocket: WebSocket connection
            user_id: User identifier
            rooms: List of rooms to join
            metadata: Additional connection metadata
        """
        await websocket.accept()
        
        # Register connection
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Store metadata
        self.connection_metadata[f"{user_id}_{id(websocket)}"] = {
            "user_id": user_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
            "rooms": rooms or [],
        }
        
        # Join rooms
        if rooms:
            for room in rooms:
                await self.join_room(room, user_id, websocket)

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """
        Remove a WebSocket connection and clean up.
        
        Args:
            websocket: WebSocket connection to remove
            user_id: Associated user ID
        """
        # Remove from active connections
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove from rooms
        metadata_key = f"{user_id}_{id(websocket)}"
        if metadata_key in self.connection_metadata:
            rooms = self.connection_metadata[metadata_key].get("rooms", [])
            for room in rooms:
                if room in self.rooms:
                    if user_id in self.rooms[room]:
                        del self.rooms[room][user_id]
                    if not self.rooms[room]:
                        del self.rooms[room]
            del self.connection_metadata[metadata_key]

    async def join_room(self, room: str, user_id: str, websocket: WebSocket):
        """
        Add a connection to a specific room.
        
        Args:
            room: Room name
            user_id: User identifier
            websocket: WebSocket connection
        """
        if room not in self.rooms:
            self.rooms[room] = {}
        self.rooms[room][user_id] = websocket

    async def leave_room(self, room: str, user_id: str):
        """
        Remove a connection from a room.
        
        Args:
            room: Room name
            user_id: User identifier
        """
        if room in self.rooms and user_id in self.rooms[room]:
            del self.rooms[room][user_id]
            if not self.rooms[room]:
                del self.rooms[room]

    async def send_personal_message(
        self, message: Dict[str, Any], user_id: str, websocket: Optional[WebSocket] = None
    ):
        """
        Send a message to a specific user.
        
        Args:
            message: Message data
            user_id: Target user
            websocket: Specific connection (if multiple for same user)
        """
        message["timestamp"] = datetime.now(timezone.utc).isoformat()
        message_str = json.dumps(message, default=str)
        
        if websocket:
            await websocket.send_text(message_str)
        elif user_id in self.active_connections:
            for conn in self.active_connections[user_id]:
                try:
                    await conn.send_text(message_str)
                except Exception:
                    await self.disconnect(conn, user_id)

    async def broadcast_to_room(
        self, room: str, message: Dict[str, Any], exclude_user: Optional[str] = None
    ):
        """
        Broadcast a message to all connections in a room.
        
        Args:
            room: Room name to broadcast to
            message: Message data
            exclude_user: User ID to exclude from broadcast
        """
        if room not in self.rooms:
            return
        
        message["timestamp"] = datetime.now(timezone.utc).isoformat()
        message_str = json.dumps(message, default=str)
        
        for user_id, conn in self.rooms[room].items():
            if user_id == exclude_user:
                continue
            try:
                await conn.send_text(message_str)
            except Exception:
                await self.disconnect(conn, user_id)

    async def broadcast_to_role(
        self, role: str, message: Dict[str, Any], exclude_user: Optional[str] = None
    ):
        """
        Broadcast to all users with a specific role.
        
        Args:
            role: User role (customer, kitchen, admin)
            message: Message data
            exclude_user: User ID to exclude
        """
        room_name = f"role:{role}"
        await self.broadcast_to_room(room_name, message, exclude_user)

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: Message data
        """
        message["timestamp"] = datetime.now(timezone.utc).isoformat()
        message_str = json.dumps(message, default=str)
        
        for user_id, connections in self.active_connections.items():
            for conn in connections:
                try:
                    await conn.send_text(message_str)
                except Exception:
                    await self.disconnect(conn, user_id)

    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self.active_connections.values())

    def get_room_connections(self, room: str) -> int:
        """Get number of connections in a room."""
        return len(self.rooms.get(room, {}))

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user has active connections."""
        return user_id in self.active_connections and bool(self.active_connections[user_id])


# Global WebSocket manager instance
manager = WebSocketConnectionManager()

# Event types for WebSocket messages
class WSEventType:
    """Standard WebSocket event types."""
    ORDER_UPDATE = "order_update"
    ORDER_STATUS_CHANGE = "order_status_change"
    NEW_ORDER = "new_order"
    KITCHEN_UPDATE = "kitchen_update"
    TABLE_UPDATE = "table_update"
    MENU_UPDATE = "menu_update"
    NOTIFICATION = "notification"
    PAYMENT_UPDATE = "payment_update"
    COMPLAINT_UPDATE = "complaint_update"
    CONNECTION_ACK = "connection_ack"
    ERROR = "error"


def create_ws_message(
    event: str, data: Dict[str, Any], status: str = "success"
) -> Dict[str, Any]:
    """
    Create a standardized WebSocket message.
    
    Args:
        event: Event type
        data: Message payload
        status: Message status
    
    Returns:
        Formatted message dictionary
    """
    return {
        "event": event,
        "status": status,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def handle_websocket_connection(
    websocket: WebSocket,
    user_id: str,
    user_role: str,
    connection_manager: WebSocketConnectionManager = manager,
):
    """
    Handle an authenticated WebSocket connection lifecycle.
    
    Args:
        websocket: WebSocket connection
        user_id: Authenticated user ID
        user_role: User role
        connection_manager: WebSocket connection manager
    """
    rooms = [f"user:{user_id}", f"role:{user_role}"]
    
    await connection_manager.connect(
        websocket,
        user_id,
        rooms=rooms,
        metadata={"role": user_role},
    )
    
    # Send connection acknowledgment
    await connection_manager.send_personal_message(
        create_ws_message(
            WSEventType.CONNECTION_ACK,
            {
                "user_id": user_id,
                "role": user_role,
                "rooms": rooms,
                "connection_id": id(websocket),
            },
        ),
        user_id,
        websocket,
    )
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ping/pong for heartbeat
            if message.get("type") == "ping":
                await websocket.send_text(
                    json.dumps({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                )
            
            # Handle room join requests
            elif message.get("type") == "join_room":
                room = message.get("room")
                if room:
                    await connection_manager.join_room(room, user_id, websocket)
            
            # Handle room leave requests
            elif message.get("type") == "leave_room":
                room = message.get("room")
                if room:
                    await connection_manager.leave_room(room, user_id)
                    
    except WebSocketDisconnect:
        await connection_manager.disconnect(websocket, user_id)
    except Exception as e:
        await connection_manager.disconnect(websocket, user_id)

