import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./features/auth/Login";
import RequestResetPassword from "./features/auth/RequestResetPassword.jsx";
import ResetPassword from "./features/auth/ResetPassword";
import EmailVerification from "./features/auth/emailverification.jsx";
import Home from "./features/events/home.jsx";
import Verifyotp from "./features/auth/verifyotp.jsx";
import Layout from "./features/events/Layout.jsx";
import UserManagement from "./features/events/usermanagement.jsx";
import PrivateRoute from "./features/auth/ProtectRoute.jsx";

function App() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/email-verification" element={<EmailVerification/>}/>
        <Route element={<PrivateRoute />}>
        <Route path="/verify-otp" element={<Verifyotp/>}/>
         <Route path="/password-reset/:uid/:token" element={<ResetPassword />} />
         <Route path="/request-reset" element={<RequestResetPassword />} />
        
        <Route element={<Layout/>}>
            <Route path="/" element={<Home/>}/>
            <Route path="/user-management" element={<UserManagement/>}/>
        </Route>
    </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App