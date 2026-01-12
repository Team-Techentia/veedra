// @/lib/socketClient.ts
import socketIOClient, { Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const socketClientUtils = {
    getSocket(): Socket {
        if (!socketInstance) {
            socketInstance = socketIOClient({
                path: "/api/socket_io",
                transports: ["websocket", "polling"],
            });

            socketInstance.on("connect", () => {
                console.log("✅ Socket.IO connected:", socketInstance?.id);
            });

            socketInstance.on("connect_error", (error: Error) => {
                console.error("❌ Socket.IO connection error:", error);
            });

            socketInstance.on("disconnect", (reason: string) => {
                console.log("🔌 Socket.IO disconnected:", reason);
            });
        }

        return socketInstance;
    },

    joinRoom(roomId: string): void {
        const socket = this.getSocket();
        socket.emit("join", roomId);
        console.log(`📦 Joined room: ${roomId}`);
    },

    leaveRoom(roomId: string): void {
        const socket = this.getSocket();
        socket.emit("leave", roomId);
        console.log(`📤 Left room: ${roomId}`);
    },

    disconnect(): void {
        if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
            console.log("🔌 Socket.IO manually disconnected");
        }
    },

    isConnected(): boolean {
        return socketInstance?.connected ?? false;
    },
};