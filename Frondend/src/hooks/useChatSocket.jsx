
import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";
const WS_BASE_URL = "ws://127.0.0.1:8000";


// =====================================================
// CHAT SOCKET
// =====================================================

export default function useChatSocket(
    conversationId,
    token,
    currentUserId
) {

    const socketRef = useRef(null);


    // =================================================
    // STATE
    // =================================================

    const [messages, setMessages] =
        useState([]);

    const [isConnected, setIsConnected] =
        useState(false);

    const [error, setError] =
        useState(null);


    // =================================================
    // LOAD PREVIOUS MESSAGES
    // =================================================

    useEffect(() => {

        if (!conversationId || !token) {

            setMessages([]);

            return;
        }


        const loadMessages = async () => {

            try {

                console.log(
                    "Loading previous messages for conversation:",
                    conversationId
                );


                const response =
                    await fetch(
                        `${API}/api/chat/conversations/${conversationId}/messages/`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Message history request failed: ${response.status}`
                    );
                }


                const data =
                    await response.json();


                console.log(
                    "MESSAGE HISTORY RESPONSE:",
                    data
                );


                /*
                    Your MessageHistoryView may return:

                    1. Array:
                    [
                        {...},
                        {...}
                    ]

                    OR

                    2. Paginated:
                    {
                        results: [...]
                    }
                */


                let previousMessages = [];


                if (
                    Array.isArray(data)
                ) {

                    previousMessages =
                        data;

                } else if (
                    Array.isArray(data.results)
                ) {

                    previousMessages =
                        data.results;

                } else if (
                    Array.isArray(data.messages)
                ) {

                    previousMessages =
                        data.messages;

                } else {

                    console.error(
                        "Unknown message history response:",
                        data
                    );

                    previousMessages =
                        [];
                }


                /*
                    Normalize messages so ChatWindow
                    gets the same structure for both
                    old and new messages.
                */

                const normalizedMessages =
                    previousMessages.map(
                        (message) => ({

                            id:
                                message.id,

                            conversation:
                                message.conversation,

                            sender:
                                message.sender,

                            sender_name:
                                message.sender_name,

                            message_type:
                                message.message_type,

                            content:
                                message.content,

                            file_url:
                                message.file_url,

                            file_name:
                                message.file_name,

                            file_size:
                                message.file_size,

                            created_at:
                                message.created_at,

                            updated_at:
                                message.updated_at,

                            is_edited:
                                message.is_edited ??
                                false,

                            is_deleted:
                                message.is_deleted ??
                                false,
                        })
                    );


                setMessages(
                    normalizedMessages
                );


                console.log(
                    "Previous messages loaded:",
                    normalizedMessages.length
                );

            } catch (err) {

                console.error(
                    "Failed to load message history:",
                    err
                );

                setError(
                    "Failed to load previous messages"
                );
            }
        };


        loadMessages();


    }, [conversationId, token]);


    // =====================================================
    // WEBSOCKET CONNECTION
    // =====================================================

    useEffect(() => {

        if (
            !conversationId ||
            !token
        ) {

            return;
        }


        const wsUrl =
            `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${token}`;


        console.log(
            "Connecting Chat WebSocket:",
            wsUrl
        );


        const socket =
            new WebSocket(wsUrl);


        socketRef.current =
            socket;


        // =================================================
        // OPEN
        // =================================================

        socket.onopen = () => {

            console.log(
                "Chat WebSocket connected"
            );

            setIsConnected(
                true
            );

            setError(
                null
            );
        };


        // =================================================
        // CLOSE
        // =================================================

        socket.onclose = () => {

            console.log(
                "Chat WebSocket disconnected"
            );

            setIsConnected(
                false
            );
        };


        // =================================================
        // ERROR
        // =================================================

        socket.onerror = (
            err
        ) => {

            console.error(
                "WebSocket error:",
                err
            );

            setError(
                "WebSocket connection error"
            );
        };


        // =================================================
        // MESSAGE
        // =================================================

        socket.onmessage = (
            event
        ) => {

            try {

                const data =
                    JSON.parse(
                        event.data
                    );


                console.log(
                    "WS RECEIVED:",
                    data
                );


                // =================================================
                // NORMAL MESSAGE
                // =================================================

                if (
                    data.type ===
                    "message"
                ) {

                    setMessages(
                        (prev) => {

                            /*
                                Prevent duplicate message.

                                This is useful if the backend
                                sends the same message more
                                than once.
                            */

                            const exists =
                                prev.some(
                                    (message) =>
                                        message.id ===
                                        data.id
                                );


                            if (exists) {

                                return prev;
                            }


                            return [
                                ...prev,

                                {
                                    id:
                                        data.id,

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

                                    created_at:
                                        data.created_at,

                                    is_edited:
                                        false,

                                    is_deleted:
                                        false,
                                }
                            ];
                        }
                    );


                    return;
                }


                // =================================================
                // ATTACHMENT
                // =================================================

                if (
                    data.type ===
                    "attachment"
                ) {

                    setMessages(
                        (prev) => {

                            const exists =
                                prev.some(
                                    (message) =>
                                        message.id ===
                                        data.id
                                );


                            if (exists) {

                                return prev;
                            }


                            return [
                                ...prev,

                                {
                                    id:
                                        data.id,

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

                                    is_edited:
                                        data.is_edited ??
                                        false,

                                    is_deleted:
                                        data.is_deleted ??
                                        false,
                                }
                            ];
                        }
                    );


                    return;
                }


                // =================================================
                // EDIT MESSAGE
                // =================================================

                if (
                    data.type ===
                    "message_edited"
                ) {

                    setMessages(
                        (prev) =>
                            prev.map(
                                (message) =>

                                    message.id ===
                                    data.message_id

                                        ? {
                                            ...message,

                                            content:
                                                data.content,

                                            is_edited:
                                                true,

                                            updated_at:
                                                data.updated_at,
                                        }

                                        : message
                            )
                    );


                    return;
                }


                // =================================================
                // DELETE MESSAGE
                // =================================================

                if (
                    data.type ===
                    "message_deleted"
                ) {

                    setMessages(
                        (prev) =>
                            prev.map(
                                (message) =>

                                    message.id ===
                                    data.message_id

                                        ? {
                                            ...message,

                                            content:
                                                null,

                                            is_deleted:
                                                true,

                                            updated_at:
                                                data.deleted_at,
                                        }

                                        : message
                            )
                    );


                    return;
                }


                // =================================================
                // CALL OFFER
                // =================================================

                if (
                    data.type ===
                    "call_offer"
                ) {

                    console.log(
                        "Incoming call offer:",
                        data
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "incoming-call",
                            {
                                detail:
                                    data
                            }
                        )
                    );


                    return;
                }


                // =================================================
                // CALL ANSWER
                // =================================================

                if (
                    data.type ===
                    "call_answer"
                ) {

                    console.log(
                        "Call answer received:",
                        data
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "call-answer",
                            {
                                detail:
                                    data
                            }
                        )
                    );


                    return;
                }


                // =================================================
                // ICE CANDIDATE
                // =================================================

                if (
                    data.type ===
                    "ice_candidate"
                ) {

                    console.log(
                        "ICE candidate received:",
                        data
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "ice-candidate",
                            {
                                detail:
                                    data
                            }
                        )
                    );


                    return;
                }


                // =================================================
                // CALL REJECTED
                // =================================================

                if (
                    data.type ===
                    "call_rejected"
                ) {

                    console.log(
                        "Call rejected:",
                        data
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "call-rejected",
                            {
                                detail:
                                    data
                            }
                        )
                    );


                    return;
                }


                // =================================================
                // CALL ENDED
                // =================================================

                if (
                    data.type ===
                    "call_ended"
                ) {

                    console.log(
                        "Call ended:",
                        data
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "call-ended",
                            {
                                detail:
                                    data
                            }
                        )
                    );


                    return;
                }


            } catch (err) {

                console.error(
                    "Invalid WebSocket message:",
                    err
                );
            }
        };


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            console.log(
                "Closing Chat WebSocket"
            );


            socket.close();


            if (
                socketRef.current ===
                socket
            ) {

                socketRef.current =
                    null;
            }


            setIsConnected(
                false
            );
        };


    }, [
        conversationId,
        token
    ]);


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = (
        message
    ) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "message",

                message:
                    message,

            })
        );
    };


    // =====================================================
    // EDIT MESSAGE
    // =====================================================

    const editMessage = (
        messageId,
        content
    ) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "edit_message",

                message_id:
                    messageId,

                content:
                    content,

            })
        );
    };


    // =====================================================
    // DELETE MESSAGE
    // =====================================================

    const deleteMessage = (
        messageId
    ) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "delete_message",

                message_id:
                    messageId,

            })
        );
    };


    // =====================================================
    // CALL OFFER
    // =====================================================

    const sendCallOffer = ({
        callId,
        receiverId,
        offer,
        callType
    }) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "call_offer",

                call_id:
                    callId,

                receiver_id:
                    receiverId,

                offer:
                    offer,

                call_type:
                    callType,

            })
        );
    };


    // =====================================================
    // CALL ANSWER
    // =====================================================

    const sendCallAnswer = ({
        callId,
        callerId,
        answer
    }) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "call_answer",

                call_id:
                    callId,

                caller_id:
                    callerId,

                answer:
                    answer,

            })
        );
    };


    // =====================================================
    // ICE CANDIDATE
    // =====================================================

    const sendIceCandidate = ({
        callId,
        receiverId,
        candidate
    }) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "ice_candidate",

                call_id:
                    callId,

                receiver_id:
                    receiverId,

                candidate:
                    candidate,

            })
        );
    };


    // =====================================================
    // REJECT CALL
    // =====================================================

    const rejectCall = ({
        callId,
        receiverId
    }) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "call_rejected",

                call_id:
                    callId,

                receiver_id:
                    receiverId,

            })
        );
    };


    // =====================================================
    // END CALL
    // =====================================================

    const endCall = ({
        callId,
        receiverId
    }) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !==
                WebSocket.OPEN
        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;
        }


        socketRef.current.send(
            JSON.stringify({

                type:
                    "call_ended",

                call_id:
                    callId,

                receiver_id:
                    receiverId,

            })
        );
    };


    // =====================================================
    // RETURN
    // =====================================================

    return {

        messages,

        setMessages,

        isConnected,

        error,


        // Messages

        sendMessage,

        editMessage,

        deleteMessage,


        // Calls

        sendCallOffer,

        sendCallAnswer,

        sendIceCandidate,

        rejectCall,

        endCall,

    };
};

