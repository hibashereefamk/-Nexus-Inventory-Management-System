import React, { useEffect, useRef } from "react";
import "./chat.css";

import { useChat } from "../../context/ChatContext";

import MessageInput from "./MessageInput";
const currentUserId =
    Number(localStorage.getItem("user_id"));

const ChatWindow = () => {

    const {
        activeConversation,
        messages,
        isConnected,
        error
    } = useChat();


    const messagesEndRef = useRef(null);


    const getConversationName = (conversation) => {

        if (
            conversation.conversation_type === "DIRECT"
        ) {

            return (
                conversation.other_user?.username ||
                conversation.other_user?.email ||
                "Direct Chat"
            );

        }

        return (
            conversation.name ||
            "Group Chat"
        );

    };


    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);


    if (!activeConversation) {

        return (
            <div className="empty-chat">

                <div className="empty-chat-icon">
                    💬
                </div>

                <h2>
                    Welcome to ERP Chat
                </h2>

                <p>
                    Select a conversation to start messaging.
                </p>

            </div>
        );

    }


    const conversationName =
        getConversationName(activeConversation);


    return (

        <div className="chat-window">

            {/* HEADER */}

            <div className="chat-header">

                <div className="chat-user">

                    <div className="avatar large">

                        {conversationName
                            .charAt(0)
                            .toUpperCase()
                        }

                    </div>


                    <div>

                        <h3>
                            {conversationName}
                        </h3>


                        <span
                            className={
                                isConnected
                                    ? "status online"
                                    : "status offline"
                            }
                        >

                            {isConnected
                                ? "Online"
                                : "Connecting..."
                            }

                        </span>

                    </div>

                </div>


                <div className="chat-actions">

                    <button title="Voice Call">
                        ☎
                    </button>

                    <button title="Video Call">
                        ▣
                    </button>

                    <button title="More">
                        ⋮
                    </button>

                </div>

            </div>


            {/* ERROR */}

            {error && (

                <div className="chat-error">
                    {error}
                </div>

            )}


            {/* MESSAGES */}

            <div className="messages-container">

                {messages.map((message) => {

    const isSent =
        Number(message.sender) === currentUserId;


    return (

        <div
            key={message.id}
            className={
                isSent
                    ? "message-row sent"
                    : "message-row received"
            }
        >

            <div className="message-bubble">

                {!isSent && (
                    <div className="message-sender">
                        {message.sender_name}
                    </div>
                )}

                <p>
                    {message.content}
                </p>

                <span className="message-time">

                    {message.created_at &&
                        new Date(
                            message.created_at
                        ).toLocaleTimeString(
                            [],
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    }

                </span>

            </div>

        </div>

    );

})}


                <div ref={messagesEndRef} />

            </div>


            {/* INPUT */}

            <MessageInput />

        </div>

    );

};


export default ChatWindow;