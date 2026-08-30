import { useEffect, useRef, useState } from "react";


const WS_BASE_URL =
    "ws://127.0.0.1:8000";

const API_BASE_URL =
    "http://127.0.0.1:8000";


export default function useChatSocket(
    conversationId,
    token
) {

    const socketRef = useRef(null);


    const [messages, setMessages] =
        useState([]);


    const [isConnected, setIsConnected] =
        useState(false);


    const [isLoadingHistory, setIsLoadingHistory] =
        useState(false);


    const [error, setError] =
        useState(null);


    // =====================================================
    // LOAD MESSAGE HISTORY
    // =====================================================

    useEffect(() => {

        if (!conversationId || !token) {

            setMessages([]);

            return;
        }


        const loadMessageHistory = async () => {

            try {

                setIsLoadingHistory(true);

                setError(null);


                const response = await fetch(

                    `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages/`,

                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }

                );


                if (!response.ok) {

                    throw new Error(
                        `History request failed: ${response.status}`
                    );

                }


                const data =
                    await response.json();


                console.log(
                    "📚 Message history:",
                    data
                );


                setMessages(data);


            } catch (error) {

                console.error(
                    "❌ Message history error:",
                    error
                );


                setError(
                    "Unable to load message history."
                );


            } finally {

                setIsLoadingHistory(false);

            }

        };


        loadMessageHistory();

    }, [conversationId, token]);


    // =====================================================
    // WEBSOCKET
    // =====================================================

    useEffect(() => {

        if (!conversationId || !token) {
            return;
        }


        const socketUrl =
            `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${token}`;


        console.log(
            "🔌 Connecting:",
            socketUrl
        );


        const socket =
            new WebSocket(socketUrl);


        socketRef.current =
            socket;


        socket.onopen = () => {

            console.log(
                "✅ Chat WebSocket connected"
            );


            setIsConnected(true);

            setError(null);

        };


        socket.onmessage = (event) => {

    try {

        const data = JSON.parse(event.data);

        console.log(
            "📨 WebSocket event:",
            data
        );


        // =============================================
        // NEW MESSAGE
        // =============================================
        
        if (data.type === "message") {

            const newMessage = {

                id: data.id,

                conversation:
                    data.conversation,

                sender:
                    data.sender,

                sender_name:
                    data.sender_name,

                message_type:
                    data.message_type || "TEXT",

                content:
                    data.content,

                created_at:
                    data.created_at,

                is_edited: false,

                is_deleted: false,

            };


            setMessages(previous => {

                const exists =
                    previous.some(
                        message =>
                            message.id ===
                            newMessage.id
                    );


                if (exists) {
                    return previous;
                }


                return [
                    ...previous,
                    newMessage
                ];

            });

        }

        else if (data.type === "attachment") {

    const newMessage = {

        id: data.id,

        conversation:
            data.conversation,

        sender:
            data.sender,

        sender_name:
            data.sender_name,

        message_type:
            data.message_type,

        content:
            data.content,

        file_url:
            data.file_url,

        file_name:
            data.file_name,

        file_size:
            data.file_size,

        created_at:
            data.created_at,

        is_edited: false,

        is_deleted: false,
    };


    setMessages(previous => {

        const exists =
            previous.some(
                message =>
                    message.id ===
                    newMessage.id
            );

        if (exists) {
            return previous;
        }

        return [
            ...previous,
            newMessage
        ];
    });
}
        // =============================================
        // MESSAGE EDITED
        // =============================================

        else if (
            data.type === "message_edited"
        ) {

            setMessages(previous =>

                previous.map(message =>

                    message.id ===
                    data.message_id

                        ? {
                            ...message,

                            content:
                                data.content,

                            is_edited:
                                true,

                            updated_at:
                                data.updated_at
                        }

                        : message

                )

            );

        }


        // =============================================
        // MESSAGE DELETED
        // =============================================

        else if (
            data.type === "message_deleted"
        ) {

            setMessages(previous =>

                previous.map(message =>

                    message.id ===
                    data.message_id

                        ? {
                            ...message,

                            content:
                                null,

                            is_deleted:
                                true,

                        }

                        : message

                )

            );

        }

    } catch (error) {

        console.error(
            "WebSocket message error:",
            error
        );

    }

};


        socket.onclose = (event) => {

            console.log(
                "🔌 WebSocket disconnected:",
                event.code
            );


            setIsConnected(false);

        };


        return () => {

            socket.close();

            socketRef.current = null;

        };


    }, [conversationId, token]);


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const editMessage = (
    messageId,
    newContent
) => {

    if (
        socketRef.current &&
        socketRef.current.readyState ===
            WebSocket.OPEN
    ) {

        socketRef.current.send(

            JSON.stringify({

                type:
                    "edit_message",

                message_id:
                    messageId,

                content:
                    newContent

            })

        );

    }

};
const deleteMessage = (
    messageId
) => {

    if (
        socketRef.current &&
        socketRef.current.readyState ===
            WebSocket.OPEN
    ) {

        socketRef.current.send(

            JSON.stringify({

                type:
                    "delete_message",

                message_id:
                    messageId

            })

        );

    }

};

    const sendMessage = (message) => {

        if (!message?.trim()) {
            return;
        }


        if (
            socketRef.current &&
            socketRef.current.readyState ===
                WebSocket.OPEN
        ) {

            socketRef.current.send(

                JSON.stringify({

                    type: "message",

                    message:
                        message.trim()

                })

            );

        } else {

            console.error(
                "❌ WebSocket is not connected"
            );

        }

    };


    // =====================================================
    // RETURN
    // =====================================================

    return {

    messages,

    sendMessage,

    editMessage,

    deleteMessage,

    isConnected,

    isLoadingHistory,

    error

};

}