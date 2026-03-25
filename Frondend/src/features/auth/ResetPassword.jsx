import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const [password, setPassword] = useState('');
    const [confirm_password, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirm_password) {
            alert("Passwords do not match!");
            return;
        }

        setLoading(true);
        const data = {
            password: password,
            token: token,
            uidb64: uid 
        };

        try {
            await axios.post('http://127.0.0.1:8000/api/password-reset-confirm/', data);
            
            setMessage("Password reset successful! Redirecting to login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error("Server Errors:", error.response?.data);
            setMessage(error.response?.data?.error || "The link is invalid or expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='auth-container'>
            <div className='auth-form'>
                <h2>Set New Password</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>New Password:</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            minLength={6}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        />
                        <label>Confirm Password:</label>
                        <input 
                            type="password" 
                            value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
                        {loading ? "Processing..." : "Reset Password"}
                    </button>
                </form>
                {message && <p style={{ marginTop: '10px', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
            </div>
        </div>
    );
};

export default ResetPassword;