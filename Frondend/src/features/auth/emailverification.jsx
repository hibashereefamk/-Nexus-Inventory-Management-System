import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import './login.css'

function EmailVerification() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/resend-otp/", {
        email: email,
      });

      if (response.status === 200) {
        navigate("/verify-otp", { state: { email: email } });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Something went wrong";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-container'style={{ padding: "20px" }}>
      
      <form className='auth-form' onSubmit={handleSubmit}>
        <h2>Activate Account</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}

export default EmailVerification;