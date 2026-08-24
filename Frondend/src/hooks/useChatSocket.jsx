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

                console.log("Chat received:", data);

                if (data.type === "chat_message") {

                    setMessages((previous) => [
                        ...previous,
                        data
                    ]);
                }

                if (data.type === "error") {

                    setError(data.message);
                }

            } catch (err) {

                console.error(
                    "Invalid WebSocket message:",
                    err
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

        if (!socketRef.current) {
            return;
        }

        if (socketRef.current.readyState !== WebSocket.OPEN) {
            setError("Chat is not connected.");
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                message: message
            })
        );
    };


    return {
        messages,
        sendMessage,
        isConnected,
        error
    };
}