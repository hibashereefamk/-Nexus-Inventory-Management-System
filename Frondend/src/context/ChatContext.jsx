import React, {
    createContext,
    useContext,
    useState
} from "react";

import useChatSocket from "../hooks/useChatSocket";


const ChatContext = createContext(null);


export const ChatProvider = ({ children }) => {

    const [activeConversation, setActiveConversation] =
        useState(null);


    const token =
        localStorage.getItem("access_token");


    const openConversation = (conversation) => {

        setActiveConversation(conversation);

    };


    const {
        messages,
        sendMessage,
        isConnected,
        isLoadingHistory,
        error
    } = useChatSocket(
        activeConversation?.id,
        token
    );


    return (

        <ChatContext.Provider
            value={{

                activeConversation,

                setActiveConversation,

                openConversation,

                messages,

                sendMessage,

                isConnected,

                isLoadingHistory,

                error

            }}
        >

            {children}

        </ChatContext.Provider>

    );

};


export const useChat = () => {

    const context = useContext(ChatContext);

    if (!context) {

        throw new Error(
            "useChat must be used inside ChatProvider"
        );

    }

    return context;

};