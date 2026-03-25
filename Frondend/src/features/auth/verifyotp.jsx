import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import './verifyOtp.css';

function Verifyotp() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  useEffect(() => {
    if (!email) {
      alert("No email found. Please start the process again.");
      navigate("/email-verification");
      return;
    }

    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval); 
  }, [timer, email, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/verify-otp/", {
        email,
        otp,
        password,
      });
      alert(response.data.message || "Account activated successfully!");
      navigate("/login"); 
    } catch (error) {
      alert(error.response?.data?.error || "Invalid OTP or something went wrong.");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return; 
    try {
      await axios.post("http://127.0.0.1:8000/api/resend-otp/", { email });
      alert("A new OTP has been sent.");
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      alert("Failed to resend OTP.");
    }
  };

  return (
    <div className="otp-container">
      <form className="otp-form" onSubmit={handleVerifyOtp}>
        <h2>Account Activation</h2>
        <p>Verifying: <strong>{email}</strong></p>
        
        <div className="input-group">
          <label>OTP Code</label>
          <input 
            type="text" 
            placeholder="6-digit OTP" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)} 
            maxLength={6}
            required
          />
        </div>

        <div className="input-group">
          <label>Set Password</label>
          <input 
            type="password" 
            placeholder="New Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>

        <div className="input-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required
          />
        </div>
        
        <button type="submit" className="verify-btn">Activate Account</button>

        <div className="resend-container">
          {canResend ? (
            <p>Didn't receive code? <span onClick={handleResendOtp} className="resend-link" style={{cursor:'pointer', color:'blue'}}>Resend OTP</span></p>
          ) : (
            <p className="timer-text">Resend code in {timer}s</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default Verifyotp;