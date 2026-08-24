import "./chat.css";

import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";


const ChatPage = () => {

    return (

        <div className="chat-page">

            <ConversationList />

            <ChatWindow />

        </div>

    );
};


export default ChatPage;