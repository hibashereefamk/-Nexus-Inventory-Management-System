import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

import {
    LayoutDashboard,
    Users,
    Settings,
    ClipboardList,
    BarChart3,
    Briefcase,
    AlertTriangle,
    Search,
    History,
    MailPlus,
    Warehouse,
    MessageSquare,
    Sparkles
} from "lucide-react";

import { FiClipboard } from "react-icons/fi";

import { useNotifications } from "../../hooks/useTaskNotifications";


const Sidebar = () => {

    // =====================================================
    // USER ROLE
    // =====================================================

    const userRole =
        localStorage.getItem("role") || "staff";


    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    const { unreadCount } =
        useNotifications();


    // =====================================================
    // CURRENT LOCATION
    // =====================================================

    const location =
        useLocation();


    // =====================================================
    // MENU CONFIGURATION
    // =====================================================

    const menuConfig = {

        // =================================================
        // ADMIN
        // =================================================

        admin: [

            {
                title: "Dashboard",
                icon: <LayoutDashboard size={18} />,
                path: "/"
            },

            {
                title: "Users & Roles",
                icon: <Users size={18} />,
                path: "/user-management"
            },

            {
                title: "Operations",
                icon: <Briefcase size={18} />,
                path: "/admin/operations"
            },

            {
                title: "Reports & Approvals",
                icon: <ClipboardList size={18} />,
                path: "/admin/reports"
            },

            {
                title: "Analytics",
                icon: <BarChart3 size={18} />,
                path: "/admin/analytics"
            },

            {
                title: "Alerts & Monitoring",
                icon: <AlertTriangle size={18} />,
                path: "/admin/alerts"
            },

            {
                title: "Settings & Logs",
                icon: <Settings size={18} />,
                path: "/admin/settings"
            }

        ],


        // =================================================
        // MANAGER
        // =================================================

        manager: [

            {
                title: "Dashboard",
                icon: <LayoutDashboard size={18} />,
                path: "/"
            },

            {
                title: "Inventory Management",
                icon: <Warehouse size={18} />,
                path: "/inventory"
            },

            {
                title: "Assignment",
                icon: <FiClipboard size={18} />,
                path: "/manager/staff-tasks"
            },

            {
                title: "Shipments & Packing",
                icon: <Briefcase size={18} />,
                path: "/manager/operations"
            },

            {
                title: "Alerts & Overdue",
                icon: <AlertTriangle size={18} />,
                path: "/manager/alerts"
            },

            {
                title: "Reports",
                icon: <ClipboardList size={18} />,
                path: "/manager/reports"
            },

            {
                title: "Performance",
                icon: <BarChart3 size={18} />,
                path: "/manager/performance"
            }

        ],


        // =================================================
        // STAFF
        // =================================================

        staff: [

            {
                title: "Dashboard",
                icon: <LayoutDashboard size={18} />,
                path: "/"
            },

            {
                title: "Task Registry",
                icon: <ClipboardList size={18} />,
                path: "/tasks/show"
            },

            {
                title: "Inventory Alerts",
                icon: <AlertTriangle size={18} />,
                path: "/inventory/alerts"
            },

            {
                title: "Stock Lookup",
                icon: <Search size={18} />,
                path: "/inventory/lookup"
            },

            {
                title: "Procurement History",
                icon: <History size={18} />,
                path: "/inventory/history"
            },

            {
                title: "Supply Request",
                icon: <MailPlus size={18} />,
                path: "/requests"
            }

        ]

    };


    // =====================================================
    // GET CURRENT ROLE MENU
    // =====================================================

    const menuItems =
        menuConfig[userRole] || [
            {
                title: "Dashboard",
                icon: <LayoutDashboard size={18} />,
                path: "/"
            }
        ];


    // =====================================================
    // ACTIVE PATH CHECK
    // =====================================================

    const isActive = (path) => {

        return location.pathname === path;

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <aside className="sidebar">


            {/* =================================================
                BRAND
            ================================================= */}

            <div className="sidebar-nameplate">

                <div className="logo-icon">
                    N
                </div>


                <div className="nameplate-text">

                    <span className="brand-name">
                        NEXUS
                    </span>

                    <span className="brand-sub">
                        INVENTORY
                    </span>

                </div>

            </div>


            <hr className="sidebar-divider" />


            {/* =================================================
                MAIN NAVIGATION
            ================================================= */}

            <nav
                className="sidebar-nav"
                aria-label="Main navigation"
            >

                <p className="sidebar-label">
                    Main Menu
                </p>


                <ul>

                    {menuItems.map(
                        (item, index) => (

                            <li
                                key={`${item.path}-${index}`}
                            >

                                <Link
    to={item.path}
    className={isActive(item.path) ? "active" : ""}
    data-tooltip={item.title}
    aria-label={item.title}
>
    <span className="nav-icon">
        {item.icon}
    </span>

    <span className="nav-text">
        {item.title}
    </span>
    
    {item.title.toLowerCase().includes("alerts") && unreadCount > 0 && (
        <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
        </span>
    )}
</Link>

                            </li>

                        )
                    )}

                </ul>

            </nav>


            {/* =================================================
                FOOTER / COLLABORATION
            ================================================= */}

            <div className="sidebar-footer">

                <hr className="sidebar-divider" />


                <p className="sidebar-label">
                    Collaboration
                </p>


                <ul>


                    {/* =================================================
                        TEAM CHAT
                    ================================================= */}

                    <li>

                        <Link
                            to="/chat"

                            className={
                                isActive("/chat")
                                    ? "active chat-active"
                                    : ""
                            }

                            data-tooltip="Team Chat"

                            aria-label="Team Chat"
                        >

                            <span className="nav-icon chat-icon">

                                <MessageSquare
                                    size={18}
                                />

                            </span>


                            <span className="nav-text">

                                Team Chat

                            </span>

                        </Link>

                    </li>


                    {/* =================================================
                        AI ASSISTANT
                    ================================================= */}

                    <li>

                        <Link
                            to="/ai-assistant"

                            className={
                                isActive(
                                    "/ai-assistant"
                                )
                                    ? "active ai-active"
                                    : ""
                            }

                            data-tooltip="AI Assistant"

                            aria-label="AI Assistant"
                        >

                            <span className="nav-icon ai-icon">

                                <Sparkles
                                    size={18}
                                />

                            </span>


                            <span className="nav-text">

                                AI Assistant

                            </span>

                        </Link>

                    </li>

                </ul>

            </div>

        </aside>

    );

};


export default Sidebar;