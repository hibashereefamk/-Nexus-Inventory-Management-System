import React, { useState } from 'react';
import axios from 'axios';
import "./Login.css";

const RequestResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            // This points to the Django view RequestPasswordResetEmail
            const response = await axios.post('http://localhost:8000/api/request-reset/', { 
                email: email 
            });
            
            setMessage('Check your email! We have sent you a link to reset your password.');
            setEmail(''); // Clear input
            
        } catch (err) {
            setError('User with this email does not exist or server error.');
        }
    };

    return (
        <div  className='auth-container'>
            <div className='auth-form'>
            <h2>Reset Password</h2>
            <p>Enter your email to receive a reset link.</p>
            
            <form  onSubmit={handleSubmit}>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Send Email
                </button>
            </form>

            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
        </div>
    );
};

export default RequestResetPassword;