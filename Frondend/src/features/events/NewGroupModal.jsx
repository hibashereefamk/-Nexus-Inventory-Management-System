import React, { useEffect, useState } from "react";
import "./groupchat.css";

const API = "http://127.0.0.1:8000";

const NewGroupModal = ({ onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [employees, setEmployees] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState("");

    const currentUserId = Number(localStorage.getItem("user_id"));
    const token = localStorage.getItem("access_token");

    // Search employees
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim()) {
                searchEmployees();
            } else {
                setEmployees([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const searchEmployees = async () => {
        try {
            setSearchLoading(true);
            setError("");

            const response = await fetch(
                `${API}/api/chat/employees/?search=${encodeURIComponent(search)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Unable to search employees");
            }

            const data = await response.json();

            setEmployees(Array.isArray(data) ? data : data.results || []);

        } catch (err) {
            console.error("Employee search error:", err);
            setError("Unable to search employees.");
        } finally {
            setSearchLoading(false);
        }
    };

    const toggleUser = (user) => {
        const userId = user.id;

        const alreadySelected = selectedUsers.some(
            (selected) => selected.id === userId
        );

        if (alreadySelected) {
            setSelectedUsers(
                selectedUsers.filter(
                    (selected) => selected.id !== userId
                )
            );
        } else {
            setSelectedUsers([
                ...selectedUsers,
                user
            ]);
        }
    };

    const removeSelectedUser = (userId) => {
        setSelectedUsers(
            selectedUsers.filter(
                (user) => user.id !== userId
            )
        );
    };

    const createGroup = async () => {
        if (!groupName.trim()) {
            setError("Please enter a group name.");
            return;
        }

        if (selectedUsers.length === 0) {
            setError("Please select at least one member.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            /*
             * Backend endpoint expected:
             *
             * POST /api/chat/conversations/group/
             *
             * body:
             * {
             *   "name": "Development Team",
             *   "member_ids": [2, 5, 8]
             * }
             */

            const response = await fetch(
                `${API}/api/chat/conversations/group/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: groupName.trim(),
                        member_ids: selectedUsers.map(
                            (user) => user.id
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Unable to create group"
                );
            }

            /*
             * Send created group back to parent
             */
            if (onGroupCreated) {
                onGroupCreated(data);
            }

            onClose();

        } catch (err) {
            console.error("Group creation error:", err);
            setError(
                err.message || "Unable to create group."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group-modal-overlay">

            <div className="group-modal">

                {/* Header */}
                <div className="group-modal-header">

                    <div>
                        <h2>Create New Group</h2>
                        <p>Add people and start a group conversation</p>
                    </div>

                    <button
                        className="group-close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>

                {/* Group Name */}
                <div className="group-form-group">

                    <label>
                        Group Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) =>
                            setGroupName(e.target.value)
                        }
                    />

                </div>

                {/* Selected Members */}
                {selectedUsers.length > 0 && (

                    <div className="selected-members">

                        <div className="selected-title">
                            Selected members ({selectedUsers.length})
                        </div>

                        <div className="selected-member-list">

                            {selectedUsers.map((user) => (

                                <div
                                    className="selected-member"
                                    key={user.id}
                                >

                                    <div className="selected-avatar">
                                        {(
                                            user.username ||
                                            user.name ||
                                            "U"
                                        )
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <span>
                                        {user.username ||
                                            user.name ||
                                            "User"}
                                    </span>

                                    <button
                                        onClick={() =>
                                            removeSelectedUser(
                                                user.id
                                            )
                                        }
                                    >
                                        ×
                                    </button>

                                </div>

                            ))}

                        </div>

                    </div>

                )}

                {/* Search */}
                <div className="group-form-group">

                    <label>
                        Add Members
                    </label>

                    <div className="group-search-wrapper">

                        <span className="search-icon">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                </div>

                {/* Search Results */}
                <div className="employee-results">

                    {searchLoading && (
                        <div className="group-empty">
                            Searching...
                        </div>
                    )}

                    {!searchLoading &&
                        search &&
                        employees.length === 0 && (
                            <div className="group-empty">
                                No employees found
                            </div>
                        )}

                    {employees.map((user) => {

                        const isSelected =
                            selectedUsers.some(
                                (selected) =>
                                    selected.id === user.id
                            );

                        /*
                         * Don't allow current user to be selected
                         * if your backend automatically adds creator.
                         */
                        if (Number(user.id) === currentUserId) {
                            return null;
                        }

                        return (
                            <div
                                key={user.id}
                                className={`employee-item ${
                                    isSelected
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    toggleUser(user)
                                }
                            >

                                <div className="employee-avatar">
                                    {(
                                        user.username ||
                                        user.name ||
                                        "U"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="employee-info">

                                    <strong>
                                        {user.username ||
                                            user.name ||
                                            "User"}
                                    </strong>

                                    {user.email && (
                                        <span>
                                            {user.email}
                                        </span>
                                    )}

                                </div>

                                <div className="employee-check">

                                    {isSelected
                                        ? "✓"
                                        : ""}

                                </div>

                            </div>
                        );
                    })}

                </div>

                {/* Error */}
                {error && (
                    <div className="group-error">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="group-modal-footer">

                    <button
                        className="group-cancel-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        className="group-create-btn"
                        onClick={createGroup}
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "Create Group"}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default NewGroupModal;