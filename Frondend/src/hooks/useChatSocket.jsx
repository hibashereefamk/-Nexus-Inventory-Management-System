import { useEffect, useRef, useState } from "react";

const WS_BASE_URL = "ws://127.0.0.1:8000";

export default function useChatSocket(conversationId, token) {
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!conversationId || !token) {
            return;
        }

        const socketUrl =
            `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${token}`;

        const socket = new WebSocket(socketUrl);

        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Chat WebSocket connected");

            setIsConnected(true);
            setError(null);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                console.log("📨 WebSocket message:", data);

                if (data.type === "message") {
                    const newMessage = {
                        id: data.id,
                        conversation: data.conversation,
                        sender: data.sender,
                        sender_name: data.sender_name,
                        message_type: data.message_type || "TEXT",
                        content: data.content,
                        created_at: data.created_at,
                    };

                    setMessages((previous) => {
                        const alreadyExists = previous.some(
                            (message) =>
                                message.id === newMessage.id
                        );

                        if (alreadyExists) {
                            return previous;
                        }

                        return [
                            ...previous,
                            newMessage
                        ];
                    });
                }

            } catch (error) {
                console.error(
                    "WebSocket message error:",
                    error
                );
            }
        };

        socket.onerror = (event) => {
            console.error(
                "Chat WebSocket error:",
                event
            );

            setError(
                "Unable to connect to chat server."
            );
        };

        socket.onclose = (event) => {
            console.log(
                "Chat WebSocket disconnected:",
                event.code
            );

            setIsConnected(false);
        };

        return () => {
            socket.close();
            socketRef.current = null;
        };

    }, [conversationId, token]);


    const sendMessage = (message) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(
                JSON.stringify({
                    type: "message",
                    message: message
                })
            );
        }
    };


    // ⭐ THIS WAS MISSING
    return {
        messages,
        isConnected,
        error,
        sendMessage
    };
}