import React, { useEffect, useRef, useState } from "react";
import {
    Phone,Mic,Paperclip,
    Video,Search,BellOff,FolderOpen,Pin,Trash2,
    MoreVertical,
    Edit
} from "lucide-react";
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
const [showChatMenu, setShowChatMenu] = useState(false);
const renderMessageContent = (message) => {

    if (message.is_deleted) {

        return (
            <p className="deleted-message">
                This message was deleted
            </p>
        );

    }


    switch (message.message_type) {

        // =========================
        // TEXT
        // =========================

        case "TEXT":

            return (
                <p className="message-content">
                    {message.content}
                </p>
            );


        // =========================
        // IMAGE
        // =========================

        case "IMAGE":

            return (
                <div className="chat-image">

                    <img
                        src={message.file_url}
                        alt={message.file_name || "Image"}
                    />

                </div>
            );


        // =========================
        // VIDEO
        // =========================

        case "VIDEO":

            return (
                <video
                    className="chat-video"
                    controls
                    src={message.file_url}
                />
            );


        // =========================
        // VOICE
        // =========================

        case "VOICE":

            return (
                <div className="voice-message">

                    <span><Mic size={18}/></span>

                    <audio
                        controls
                        src={message.file_url}
                    />

                </div>
            );


        // =========================
        // FILE
        // =========================

        case "FILE":

            return (
                <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-file"
                >

                    <span className="file-icon">
                        <Paperclip size={20} />
                    </span>

                    <span>

                        {message.file_name ||
                            "Download file"}

                    </span>

                </a>
            );


        default:

            return (
                <p className="message-content">
                    {message.content}
                </p>
            );

    }

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

    {/* VOICE CALL */}

    <button
        type="button"
        className="chat-action-button"
        title="Voice call"
        onClick={() => {
            console.log("Start voice call");
        }}
    >
       <Video size={19} strokeWidth={2} />
    </button>


    {/* VIDEO CALL */}

    <button
        type="button"
        className="chat-action-button"
        title="Video call"
        onClick={() => {
            console.log("Start video call");
        }}
    >
       <Phone size={19} strokeWidth={2} />
    </button>


    {/* THREE DOTS */}

    <div className="chat-menu-wrapper">

        <button
            type="button"
            className="chat-action-button"
            title="More"
            onClick={() =>
                setShowChatMenu(
                    previous => !previous
                )
            }
        >
            <MoreVertical
            size={20}
            strokeWidth={2}
        />
        </button>


        {showChatMenu && (

            <div className="chat-settings-menu">

                <button
                    onClick={() => {
                        console.log(
                            "Search messages"
                        );

                        setShowChatMenu(false);
                    }}
                >
                    <Search size={20}/>
                    <span>
                        Search messages
                    </span>
                </button>


                <button
                    onClick={() => {
                        console.log(
                            "Mute notifications"
                        );

                        setShowChatMenu(false);
                    }}
                >
                    <BellOff size={20}/>
                    <span>
                        Mute notifications
                    </span>
                </button>


                <button
                    onClick={() => {
                        console.log(
                            "Pinned messages"
                        );

                        setShowChatMenu(false);
                    }}
                >
                    <Pin size={20} />
                    <span>
                        Pinned messages
                    </span>
                </button>


                <button
                    onClick={() => {
                        console.log(
                            "Shared files"
                        );

                        setShowChatMenu(false);
                    }}
                >
                   <FolderOpen size={20}/>
                    <span>
                        Shared files
                    </span>
                </button>


                <div className="menu-divider" />


                <button
                    className="danger-option"
                    onClick={() => {
                        console.log(
                            "Clear chat"
                        );

                        setShowChatMenu(false);
                    }}
                >
                   <Trash2 size={18}/>
                    <span>
                        Clear chat
                    </span>
                </button>

            </div>

        )}

    </div>

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

    {!isSent && (
        <div className="message-sender">
            {message.sender_name}
        </div>
    )}


    {editingMessageId === message.id ? (

        <div className="edit-message-box">

            <input
                type="text"
                value={editingText}
                onChange={(e) =>
                    setEditingText(e.target.value)
                }
                autoFocus
            />

            <div className="edit-actions">

                <button onClick={saveEdit}>
                    Save
                </button>

                <button onClick={cancelEdit}>
                    Cancel
                </button>

            </div>

        </div>

    ) : (

        <>
            {renderMessageContent(message)}

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

                                        <Edit size={20} /> Edit

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

                                        <Trash2 size={20}/> Delete

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