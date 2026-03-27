import React, { useState } from "react";
import "./Login.css";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';


function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  
  const handleLoginSuccess = (data) => {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('role', data.role);
    if (data.role_display) {
        localStorage.setItem('role_display', data.role_display);
    }
    if (data.username) {
    localStorage.setItem('username', data.username);
  }
  if (data.department_name){
    localStorage.setItem("department_name",data.department_name)
  }
    console.log("Login Success Data:", data);
    alert("Login successful!",data);
    navigate("/");
  };
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login/", formData);
      handleLoginSuccess(response.data);
      
      
    } catch (error) {
      console.error("Error logging in:", error);
      if (error.response?.status === 403 && error.response?.data?.message === "Email not verified") {
        alert("Please verify your email first.");
      } else if (error.response?.status === 401) {
        alert("Invalid email or password.");
      } else {
        alert("Something went wrong. Is the backend server running?");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("Google Token:", credentialResponse.credential);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/google-login/", {
        token: credentialResponse.credential
      });
      
      handleLoginSuccess(response.data);
      
    } catch (error) {
      console.error("Google Login Backend Error:", error);
      showAlert("Google login failed at backend. Check console for details.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <div style={{ margin: '10px 0', textAlign: 'right' }}>
          <Link to="/request-reset" style={{ color: 'blue', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>
        <button type="submit">Login</button>
        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <p>
            Don't have an activate account?
            <Link to="/email-verification" style={{ marginLeft: "5px", color: "#007bff" }}>
              Activate account
            </Link>
          </p>
        </div>
        {/* <p style={{ textAlign: "center", margin: "20px 0" }}>------------- OR -------------</p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Google Login Failed');
            }}
            useOneTap
            theme="outline"
            size="large"
            width="350"
        //   /> */}
        {/* // </div> */} 
      </form>
    </div>
  );
}

export default Login;