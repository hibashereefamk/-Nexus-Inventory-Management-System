import React, { useEffect, useState } from "react";

import "./chat.css";

import { UsersRound } from "lucide-react";

import { useChat } from "../../context/ChatContext";

import NewChatModal from "./NewChatModal";
import NewGroupModal from "./NewGroupModal";

const API = "http://127.0.0.1:8000";

const ConversationList = () => {
    const {
        activeConversation,
        setActiveConversation
    } = useChat();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access_token");

            const response = await fetch(
                `${API}/api/chat/conversations/`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load conversations.");
            }

            const data = await response.json();

            setConversations(
                Array.isArray(data)
                    ? data
                    : data.results || data.conversations || []
            );

        } catch (err) {
            console.error("Conversation error:", err);
            setError("Unable to load conversations.");
        } finally {
            setLoading(false);
        }
    };

    const getConversationName = (conversation) => {
        if (conversation.conversation_type === "DIRECT") {
            return (
                conversation.other_user?.username ||
                "Direct Chat"
            );
        }

        return conversation.name || "Group Chat";
    };

    const filteredConversations = conversations.filter(
        (conversation) =>
            getConversationName(conversation)
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="conversation-list">
                <div className="conversation-header">
                    <h3>Messages</h3>
                </div>

                <div className="conversation-status">
                    Loading conversations...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="conversation-list">
                <div className="conversation-header">
                    <h3>Messages</h3>
                </div>

                <div className="conversation-status error">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="conversation-list">

            {/* HEADER */}
            <div className="conversation-header">

                <h3>Messages</h3>

                <div className="chat-actions">

                    {/* New Direct Chat */}
                    <button
                        type="button"
                        className="new-chat-button"
                        onClick={() => setShowNewChat(true)}
                        title="New Chat"
                    >
                        +
                    </button>

                    {/* New Group */}
                    <button
                        type="button"
                        className="new-group-button"
                        onClick={() => setShowNewGroup(true)}
                        title="Create Group"
                    >
                        <UsersRound size={19} />
                    </button>

                </div>

            </div>

            {/* SEARCH */}
            <div className="search-box">

                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            {/* CONVERSATIONS */}
            <div className="conversation-items">

                {filteredConversations.length === 0 ? (

                    <div className="conversation-status">
                        {search
                            ? "No conversations found."
                            : "No conversations yet."}
                    </div>

                ) : (

                    filteredConversations.map(
                        (conversation) => {

                            const conversationName =
                                getConversationName(conversation);

                            const isGroup =
                                conversation.conversation_type ===
                                "GROUP";

                            return (
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

                                    {/* Avatar */}
                                    <div
                                        className={
                                            `avatar ${
                                                isGroup
                                                    ? "group-avatar"
                                                    : ""
                                            }`
                                        }
                                    >

                                        {isGroup ? (
                                            <UsersRound size={19} />
                                        ) : (
                                            conversationName
                                                .charAt(0)
                                                .toUpperCase()
                                        )}

                                    </div>

                                    {/* Conversation info */}
                                    <div className="conversation-info">

                                        <div className="conversation-top">

                                            <strong>
                                                {conversationName}
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
                            );
                        }
                    )

                )}

            </div>

            {/* NEW DIRECT CHAT MODAL */}
            {showNewChat && (
                <NewChatModal
                    onClose={() => {
                        setShowNewChat(false);
                        fetchConversations();
                    }}
                />
            )}

            {/* NEW GROUP MODAL */}
            {showNewGroup && (
                <NewGroupModal
                    onClose={() => {
                        setShowNewGroup(false);
                    }}

                    onCreated={(newGroup) => {

                        setConversations((prev) => [
                            newGroup,
                            ...prev
                        ]);

                        setActiveConversation(newGroup);

                        setShowNewGroup(false);
                    }}
                />
            )}

        </div>
    );
};

export default ConversationList;