import { useEffect, useRef, useState } from "react";

const WS_BASE_URL = "ws://127.0.0.1:8000";

export default function useChatSocket(conversationId, token, currentUserId) {
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    // =====================================================
    // CONNECT
    // =====================================================

    useEffect(() => {

        if (!conversationId || !token) {
            return;
        }

        const wsUrl =
            `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${token}`;

        const socket = new WebSocket(wsUrl);

        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Chat WebSocket connected");
            setIsConnected(true);
            setError(null);
        };

        socket.onclose = () => {
            console.log("Chat WebSocket disconnected");
            setIsConnected(false);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError("WebSocket connection error");
        };

        socket.onmessage = (event) => {

            try {

                const data = JSON.parse(event.data);

                console.log("WS RECEIVED:", data);

                // =================================================
                // NORMAL MESSAGE
                // =================================================

                if (data.type === "message") {

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: data.id,
                            conversation: data.conversation,
                            sender: data.sender,
                            sender_name: data.sender_name,
                            message_type: data.message_type,
                            content: data.content,
                            created_at: data.created_at,
                            is_edited: false,
                            is_deleted: false,
                        }
                    ]);

                    return;
                }

                // =================================================
                // ATTACHMENT
                // =================================================

                if (data.type === "attachment") {

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: data.id,
                            conversation: data.conversation,
                            sender: data.sender,
                            sender_name: data.sender_name,
                            message_type: data.message_type,
                            content: data.content,
                            file_url: data.file_url,
                            file_name: data.file_name,
                            file_size: data.file_size,
                            created_at: data.created_at,
                            is_edited: data.is_edited,
                            is_deleted: data.is_deleted,
                        }
                    ]);

                    return;
                }

                // =================================================
                // EDIT MESSAGE
                // =================================================

                if (data.type === "message_edited") {

                    setMessages((prev) =>
                        prev.map((message) =>
                            message.id === data.message_id
                                ? {
                                    ...message,
                                    content: data.content,
                                    is_edited: true,
                                    updated_at: data.updated_at,
                                }
                                : message
                        )
                    );

                    return;
                }

                // =================================================
                // DELETE MESSAGE
                // =================================================

                if (data.type === "message_deleted") {

                    setMessages((prev) =>
                        prev.map((message) =>
                            message.id === data.message_id
                                ? {
                                    ...message,
                                    content: null,
                                    is_deleted: true,
                                    updated_at: data.deleted_at,
                                }
                                : message
                        )
                    );

                    return;
                }

                // =================================================
                // CALL OFFER
                // =================================================

                if (data.type === "call_offer") {

                    console.log("Incoming call offer:", data);

                    // later WebRTC handler
                    window.dispatchEvent(
                        new CustomEvent("incoming-call", {
                            detail: data
                        })
                    );

                    return;
                }

                // =================================================
                // CALL ANSWER
                // =================================================

                if (data.type === "call_answer") {

                    console.log("Call answer received:", data);

                    window.dispatchEvent(
                        new CustomEvent("call-answer", {
                            detail: data
                        })
                    );

                    return;
                }

                // =================================================
                // ICE CANDIDATE
                // =================================================

                if (data.type === "ice_candidate") {

                    console.log("ICE candidate received:", data);

                    window.dispatchEvent(
                        new CustomEvent("ice-candidate", {
                            detail: data
                        })
                    );

                    return;
                }

                // =================================================
                // CALL REJECTED
                // =================================================

                if (data.type === "call_rejected") {

                    console.log("Call rejected:", data);

                    window.dispatchEvent(
                        new CustomEvent("call-rejected", {
                            detail: data
                        })
                    );

                    return;
                }

                // =================================================
                // CALL ENDED
                // =================================================

                if (data.type === "call_ended") {

                    console.log("Call ended:", data);

                    window.dispatchEvent(
                        new CustomEvent("call-ended", {
                            detail: data
                        })
                    );

                    return;
                }

            } catch (error) {

                console.error(
                    "Invalid WebSocket message:",
                    error
                );

            }
        };

        return () => {

            socket.close();

            socketRef.current = null;

        };

    }, [conversationId, token]);


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = (message) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            console.error("WebSocket is not connected");
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                type: "message",
                message: message,
            })
        );
    };


    // =====================================================
    // EDIT MESSAGE
    // =====================================================

    const editMessage = (messageId, content) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                type: "edit_message",
                message_id: messageId,
                content: content,
            })
        );
    };


    // =====================================================
    // DELETE MESSAGE
    // =====================================================

    const deleteMessage = (messageId) => {

        if (
            !socketRef.current ||
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({
                type: "delete_message",
                message_id: messageId,
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
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({

                type: "call_offer",

                call_id: callId,

                receiver_id: receiverId,

                offer: offer,

                call_type: callType,

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
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({

                type: "call_answer",

                call_id: callId,

                caller_id: callerId,

                answer: answer,

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
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({

                type: "ice_candidate",

                call_id: callId,

                receiver_id: receiverId,

                candidate: candidate,

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
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({

                type: "call_rejected",

                call_id: callId,

                receiver_id: receiverId,

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
            socketRef.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        socketRef.current.send(
            JSON.stringify({

                type: "call_ended",

                call_id: callId,

                receiver_id: receiverId,

            })
        );
    };


    return {

        messages,

        setMessages,

        isConnected,

        error,

        sendMessage,

        editMessage,

        deleteMessage,

        sendCallOffer,

        sendCallAnswer,

        sendIceCandidate,

        rejectCall,

        endCall,

    };
}