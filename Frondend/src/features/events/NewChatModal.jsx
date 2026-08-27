import React, {
    useEffect,
    useState
} from "react";
import { useChat } from "../../context/ChatContext";

const API = "http://127.0.0.1:8000";


const NewChatModal = ({ onClose }) => {

    const [search, setSearch] = useState("");

    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(false);

    const [creating, setCreating] = useState(false);

    const [error, setError] = useState(null);


    useEffect(() => {

        if (!search.trim()) {

            setEmployees([]);

            return;
        }

        const timer = setTimeout(() => {

            searchEmployees();

        }, 400);

        return () => clearTimeout(timer);

    }, [search]);
    const {openConversation} = useChat();

    const searchEmployees = async () => {

        try {

            setLoading(true);

            setError(null);

            const token =
                localStorage.getItem(
                    "access_token"
                );


            const response = await fetch(

                `${API}/api/chat/employees/?search=${encodeURIComponent(
                    search
                )}`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );


            if (!response.ok) {

                throw new Error(
                    "Failed to search employees."
                );
            }


            const data =
                await response.json();


            setEmployees(data);
            

        } catch (err) {

            console.error(err);

            setError(
                "Unable to search employees."
            );

        } finally {

            setLoading(false);
        }
    };


    const startChat = async (employee) => {

        try {

            setCreating(true);

            setError(null);

            const token =
                localStorage.getItem(
                    "access_token"
                );


            const response = await fetch(

                `${API}/api/chat/conversations/direct/`,

                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        user_id: employee.id

                    })
                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to create chat."
                );
            }
            const conversation = data.conversation;

openConversation(conversation);

onClose();

            console.log(
                "Conversation created:",
                data
            );


            onClose();


        } catch (err) {

            console.error(err);

            setError(
                err.message
            );

        } finally {

            setCreating(false);
        }
    };


    return (

        <div className="new-chat-overlay">

            <div className="new-chat-modal">

                <div className="new-chat-header">

                    <div>
                        <h3>
                            New Conversation
                        </h3>

                        <p>
                            Search an employee to start a chat
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="close-button"
                    >
                        ×
                    </button>

                </div>


                <div className="employee-search">

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search employee..."
                        autoFocus
                    />

                </div>


                {loading && (

                    <div className="search-status">
                        Searching...
                    </div>

                )}


                {error && (

                    <div className="search-error">
                        {error}
                    </div>

                )}


                <div className="employee-results">

                    {employees.map(
                        (employee) => (

                            <div
                                key={employee.id}
                                className="employee-item"
                                onClick={() =>
                                    !creating &&
                                    startChat(employee)
                                }
                            >

                                <div className="employee-avatar">

                                    {employee.username
                                        .charAt(0)
                                        .toUpperCase()
                                    }

                                </div>


                                <div className="employee-info">

                                    <strong>
                                        {employee.username}
                                    </strong>

                                    <span>
                                        {employee.email}
                                    </span>

                                    <small>
                                        {employee.role}
                                        {employee.department_name
                                            ? ` • ${employee.department_name}`
                                            : ""
                                        }
                                    </small>

                                </div>


                                <div>
                                    →
                                </div>

                            </div>

                        )
                    )}


                    {!loading &&
                        search &&
                        employees.length === 0 && (

                            <div className="no-results">
                                No employees found.
                            </div>

                        )}

                </div>

            </div>

        </div>

    );
};


export default NewChatModal;