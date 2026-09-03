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
import StaffPackingQueue from "./features/events/StaffPackingQueue"; 
import InventoryAlertPage from "./features/events/InventoryAlertPage";
import InventoryReorderForm from "./features/events/InventoryReorderForm.jsx";
import TaskDetailPage from "./features/events/TaskDetailPage.jsx";
import ProcurementHistory from "./features/events/ProcurementHistory.jsx";
import StockLookup from "./features/events/StockLookup.jsx";
import SupplyRequest from "./features/events/SupplyRequest.jsx";
import TaskInspectionPage from "./features/events/TaskInspectionPage.jsx";
import ManagerTasksView from "./features/events/ManagerTasksView.jsx";
import AlertsAndOverdue from "./features/events/AlertsAndOverdue.jsx";
import ManagerEscalateReport from "./features/events/ManagerReport.jsx";
import ManagerPerformance from "./features/events/ManagerPerformance.jsx";
import HelpPage from "./features/events/Help.jsx";
import ProfilePage from "./features/events/Profile.jsx";
import OperationsView from "./features/events/OperationView.jsx";
import ApprovalsView from "./features/events/ApprovalsView.jsx";
import AnalyticsView from "./features/events/AnalyticsView.jsx";
import MonitoringView from "./features/events/MonitoringView.jsx";
import SystemLogsTable from "./features/events/SystemLogsTable.jsx";
import ProductList from "./features/events/ProductList.jsx";
import StaffTasksView from "./features/events/StaffTasksView.jsx";
import ManagerOrderReview from "./features/events/OrderDetailView.jsx";
import NotificationPanel from "./features/events/NotificationPanel.jsx";
import { NotificationProvider } from "./hooks/useTaskNotifications.jsx";
import OrderReviewPage from "./features/events/OrderReviewPage.jsx";
import TeamChat from "./features/events/TeamChat.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import ChatPage from "./features/events/ChatPage.jsx";


function App() {
  return (
     <BrowserRouter>
     <NotificationProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/email-verification" element={<EmailVerification/>}/>
        <Route element={<PrivateRoute />}>
        <Route path="/verify-otp" element={<Verifyotp/>}/>
         <Route path="/password-reset/:uid/:token" element={<ResetPassword />} />
         <Route path="/request-reset" element={<RequestResetPassword />} />
        
        <Route element={<Layout/>}>
    <Route path="/" element={<Home/>}/>
    <Route path="/tasks/queue" element={<StaffPackingQueue />} /> 
    <Route path="/tasks/detail/:id" element={<TaskDetailPage />} />
    <Route path="/tasks/show" element={<StaffTasksView />} />
    <Route path="/inventory/lookup" element={<StockLookup />} />
    <Route path="/inventory/history" element={<ProcurementHistory />} />
    <Route path="/chat"  element={<ChatProvider><ChatPage /></ChatProvider>}/>
    <Route path="/requests" element={<SupplyRequest />} />
    <Route path="/inventory/alerts" element={<InventoryAlertPage />} />
    <Route path="/inventory" element={<ProductList />}/>
    <Route path="/inventory/reorder/:id" element={<InventoryReorderForm/>} />
    <Route path="/user-management" element={<UserManagement />} />
    <Route path="/tasks/inspect/:id" element={<TaskInspectionPage />} />
    <Route path="/manager/alerts" element={<AlertsAndOverdue/>}/>
    <Route path="/manager/staff-tasks" element={<ManagerTasksView/>}/>
    <Route path="/manager/reports" element ={<ManagerEscalateReport/>}/>
    <Route path="/manager/performance" element={<ManagerPerformance/>}/>
    <Route path="/manager/order-review/:taskId" element={<ManagerOrderReview/>}/>
    <Route path="/help" element={<HelpPage/>}/>
    <Route path="/notifications" element={<NotificationPanel apiBase="http://127.0.0.1:8000" headers={{ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }}} />}/>
    <Route path="/profile" element={<ProfilePage/>}/>
    <Route path="/admin/operations" element={<OperationsView/>}/>
    <Route path="/admin/reports" element={<ApprovalsView/>}/>
    <Route path="/admin/analytics" element={<AnalyticsView/>}/>
    <Route path="/staff/order-review/:taskId" element={<OrderReviewPage/>}/>
    <Route path="/admin/alerts" element={<MonitoringView/>}/>
    <Route path="/admin/settings" element={<SystemLogsTable/>}/>

</Route>
    </Route>
      </Routes>
      </NotificationProvider>
    </BrowserRouter>
  )
}

export default App