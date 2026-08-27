import React, { useEffect, useState } from "react";

import NewChatModal from "./NewChatModal";
import "./chat.css";

import { useChat } from "../../context/ChatContext";


const API = "http://127.0.0.1:8000";


const ConversationList = () => {

    const {
        activeConversation,
        setActiveConversation
    } = useChat();

    const [conversations, setConversations] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showNewChat, setShowNewChat] = useState(false);

    const [error, setError] = useState(null);


    useEffect(() => {

        fetchConversations();

    }, []);


    const fetchConversations = async () => {

        try {

            setLoading(true);

            setError(null);

            const token =
                localStorage.getItem("access_token");


            const response = await fetch(
                `${API}/api/chat/conversations/`,
                {
                    method: "GET",

                    headers: {
                        "Content-Type": "application/json",

                        "Authorization":
                            `Bearer ${token}`,
                    },
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to load conversations."
                );

            }


            const data = await response.json();

            setConversations(data);


        } catch (err) {

            console.error(
                "Conversation error:",
                err
            );

            setError(
                "Unable to load conversations."
            );


        } finally {

            setLoading(false);

        }

    };


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


    if (loading) {

        return (
            <div className="conversation-list">

                <div className="conversation-header">

                    <h3>
                        Messages
                    </h3>

                </div>

                <div style={{ padding: 20 }}>
                    Loading conversations...
                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="conversation-list">

                <div className="conversation-header">

                    <h3>
                        Messages
                    </h3>

                </div>

                <div style={{ padding: 20 }}>
                    {error}
                </div>

            </div>
        );

    }


    return (

        <div className="conversation-list">

            <div className="conversation-header">

                <h3>
                    Messages
                </h3>


                <button
                    className="new-chat-button"
                    onClick={() =>
                        setShowNewChat(true)
                    }
                >
                    +
                </button>

            </div>


            <div className="search-box">

                <input
                    type="text"
                    placeholder="Search conversations..."
                />

            </div>


            <div className="conversation-items">

                {conversations.length === 0 ? (

                    <div
                        style={{
                            padding: "30px 20px",
                            textAlign: "center",
                            color: "#94a3b8"
                        }}
                    >
                        No conversations yet.
                    </div>

                ) : (

                    conversations.map(
                        (conversation) => (

                            <div
                                key={conversation.id}

                                className={
                                    `conversation-item ${
                                        activeConversation?.id ===
                                        conversation.id
                                            ? "active"
                                            : ""
                                    }`
                                }

                                onClick={() =>
                                    setActiveConversation(
                                        conversation
                                    )
                                }
                            >

                                <div className="avatar">

                                    {getConversationName(
                                        conversation
                                    )
                                        .charAt(0)
                                        .toUpperCase()
                                    }

                                </div>


                                <div className="conversation-info">

                                    <div className="conversation-top">

                                        <strong>
                                            {getConversationName(
                                                conversation
                                            )}
                                        </strong>


                                        <span>

                                            {
                                                conversation
                                                    .last_message
                                                    ?.created_at
                                                    ? new Date(
                                                        conversation
                                                            .last_message
                                                            .created_at
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }
                                                    )
                                                    : ""
                                            }

                                        </span>

                                    </div>


                                    <div className="conversation-bottom">

                                        <p>

                                            {
                                                conversation
                                                    .last_message
                                                    ?.content ||
                                                "No messages yet"
                                            }

                                        </p>

                                    </div>

                                </div>

                            </div>

                        )
                    )

                )}

            </div>


            {/* NEW CHAT MODAL */}

            {showNewChat && (

                <NewChatModal

                    onClose={() => {
                        setShowNewChat(false);

                        // Refresh conversations
                        fetchConversations();
                    }}

                />

            )}

        </div>

    );

};


export default ConversationList;