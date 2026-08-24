import React from "react";
import "./chat.css";

import { useChat } from "../context/ChatContext";


const ConversationList = () => {

    const {
        activeConversation,
        setActiveConversation
    } = useChat();


    const conversations = [
        {
            id: 1,
            name: "Manager",
            type: "DIRECT",
            lastMessage: "Please verify order #1001",
            time: "10:30 AM",
            online: true
        },
        {
            id: 2,
            name: "Inventory Team",
            type: "TEAM",
            lastMessage: "Stock verification completed",
            time: "09:45 AM",
            online: true
        }
    ];


    return (
        <div className="conversation-list">

            <div className="conversation-header">
                <h3>Messages</h3>

                <button className="new-chat-button">
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

                {conversations.map((conversation) => (

                    <div
                        key={conversation.id}
                        className={
                            `conversation-item ${
                                activeConversation?.id === conversation.id
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setActiveConversation(conversation)
                        }
                    >

                        <div className="avatar">

                            {conversation.name
                                .charAt(0)
                                .toUpperCase()
                            }

                            {conversation.online && (
                                <span className="online-dot" />
                            )}

                        </div>


                        <div className="conversation-info">

                            <div className="conversation-top">

                                <strong>
                                    {conversation.name}
                                </strong>

                                <span>
                                    {conversation.time}
                                </span>

                            </div>


                            <div className="conversation-bottom">

                                <p>
                                    {conversation.lastMessage}
                                </p>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
};


export default ConversationList;