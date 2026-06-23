import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import './TopNavbar.css';

import { useNotifications } from '../../hooks/useTaskNotifications';

function TopNavbar() {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const {
    unreadCount
  } = useNotifications();
console.log("Unread:", unreadCount);
  const username =
    localStorage.getItem('username') || 'User';

  const role =
    localStorage.getItem('role_display') || '';

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const Clickhelp = () => {
    navigate('/help');
  };

  return (
    <div className="top-navbar">

      <div className="top-left"></div>

      <div className="top-right">

        {/* Notification */}
        <div
  className="relative cursor-pointer inline-flex items-center"
  onClick={handleNotificationClick}
>

          <Bell
            size={20}
            className="
              text-slate-700
              hover:text-blue-600
            "
          />

          {unreadCount > 0 && (

            <span
  className="
    absolute
    -top-2
    -right-2
    bg-red-500
    text-white
    text-[10px]
    min-w-[18px]
    h-[18px]
    rounded-full
    flex
    items-center
    justify-center
    font-bold
    z-50
  "
>
  {unreadCount > 99 ? '99+' : unreadCount}
</span>

          )}

        </div>

        {/* Help */}
        <div
          className="nav-item"
          onClick={Clickhelp}
        >
          ❓ Help
        </div>

        {/* Profile */}
        <div
          className="profile-menu"
          onClick={() => setOpen(!open)}
        >

          <span className="avatar">
            {username[0].toUpperCase()}
          </span>

          <div>

            <span>
              {username} - {role}
            </span>

            {open && (
              <div className="dropdown">

                <p onClick={() => navigate('/profile')}>
                  Profile
                </p>

                <p onClick={() => navigate('/help')}>
                  Help
                </p>

                <p onClick={() => navigate('/login')}>
                  Logout
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default TopNavbar;