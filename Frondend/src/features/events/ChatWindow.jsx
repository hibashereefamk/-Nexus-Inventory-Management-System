import React, { useEffect, useRef, useState } from "react";
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
    error,
    editMessage,
    deleteMessage
} = useChat();
    const [openMenuId, setOpenMenuId] =
    useState(null);
    const [editingMessageId, setEditingMessageId] =
    useState(null);

    const [editingText, setEditingText] =
    useState("");
    
    const startEditing = (message) => {

    setEditingMessageId(message.id);

    setEditingText(message.content || "");

    setOpenMenuId(null);

};
    const saveEdit = () => {

    if (!editingText.trim()) {
        return;
    }

    editMessage(
        editingMessageId,
        editingText.trim()
    );

    setEditingMessageId(null);

    setEditingText("");

};
    const cancelEdit = () => {

    setEditingMessageId(null);

    setEditingText("");

};

    const messagesEndRef = useRef(null);


    const getConversationName = (conversation) => {

        if (
            conversation.conversation_type === "DIRECT"
        ) {

            return (
                conversation.other_user?.username ||
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


    const isMenuOpen =
        openMenuId === message.id;


    return (

        <div
            key={message.id}
            className={
                isSent
                    ? "message-row sent"
                    : "message-row received"
            }
        >

            <div className="message-wrapper">


                {/* ================================= */}
                {/* MESSAGE BUBBLE */}
                {/* ================================= */}

                <div className="message-bubble">


                    {/* SENDER NAME FOR RECEIVED */}
                    {!isSent && (

                        <div className="message-sender">

                            {message.sender_name}

                        </div>

                    )}


                    {/* ================================= */}
                    {/* DELETED MESSAGE */}
                    {/* ================================= */}

                    {message.is_deleted ? (

                        <p className="deleted-message">

                            This message was deleted

                        </p>

                    ) : editingMessageId ===
                        message.id ? (


                        /* ================================= */
                        /* EDIT MODE */
                        /* ================================= */

                        <div className="edit-message-box">

                            <input

                                type="text"

                                value={editingText}

                                onChange={(e) =>
                                    setEditingText(
                                        e.target.value
                                    )
                                }

                                autoFocus

                            />


                            <div className="edit-actions">

                                <button
                                    onClick={
                                        saveEdit
                                    }
                                >
                                    Save
                                </button>


                                <button
                                    onClick={
                                        cancelEdit
                                    }
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>


                    ) : (


                        /* ================================= */
                        /* NORMAL MESSAGE */
                        /* ================================= */

                        <>

                            <p className="message-content">

                                {message.content}

                            </p>


                            <div className="message-bottom">

                               <span className="message-time">
    {message.created_at &&
        new Date(
            message.created_at
        ).toLocaleTimeString(
            [],
            {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
}
        )
    }
</span>


                                {message.is_edited && (

                                    <span className="edited-label">

                                        edited

                                    </span>

                                )}

                            </div>

                        </>

                    )}


                    {/* ================================= */}
                    {/* 3 DOTS - ONLY OWN MESSAGE */}
                    {/* ================================= */}

                    {isSent &&
                        !message.is_deleted &&
                        editingMessageId !==
                            message.id && (

                        <div className="message-menu-container">


                            <button
                                className="message-menu-button"

                                onClick={() =>

                                    setOpenMenuId(
                                        isMenuOpen
                                            ? null
                                            : message.id
                                    )

                                }

                                title="Message options"
                            >

                                ⋮

                            </button>


                            {/* ================================= */}
                            {/* DROPDOWN */}
                            {/* ================================= */}

                            {isMenuOpen && (

                                <div className="message-dropdown">


                                    <button

                                        onClick={() =>
                                            startEditing(
                                                message
                                            )
                                        }

                                    >

                                        ✏️ Edit

                                    </button>


                                    <button

                                        className="delete-option"

                                        onClick={() => {

                                            deleteMessage(
                                                message.id
                                            );

                                            setOpenMenuId(
                                                null
                                            );

                                        }}

                                    >

                                        🗑 Delete

                                    </button>


                                </div>

                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

})}

            </div>


            {/* INPUT */}

            <MessageInput />

        </div>

    );

};


export default ChatWindow;