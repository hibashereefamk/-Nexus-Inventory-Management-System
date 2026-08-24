import React, { useEffect, useRef } from "react";
import "./chat.css";

import { useChat } from "../context/ChatContext";

import MessageInput from "./MessageInput";


const ChatWindow = () => {

    const {
        activeConversation,
        messages,
        isConnected,
        error
    } = useChat();


    const messagesEndRef = useRef(null);


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


    return (
        <div className="chat-window">

            {/* HEADER */}

            <div className="chat-header">

                <div className="chat-user">

                    <div className="avatar large">
                        {activeConversation.name
                            .charAt(0)
                            .toUpperCase()
                        }
                    </div>


                    <div>

                        <h3>
                            {activeConversation.name}
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

                {messages.map((message) => (

                    <div
                        key={message.message_id}
                        className="message-row"
                    >

                        <div className="message-bubble">

                            <p>
                                {message.message}
                            </p>

                            <span>
                                {new Date(
                                    message.created_at
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </span>

                        </div>

                    </div>

                ))}

                <div ref={messagesEndRef} />

            </div>


            {/* INPUT */}

            <MessageInput />

        </div>
    );
};


export default ChatWindow;