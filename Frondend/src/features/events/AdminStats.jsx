import React from 'react'

function AdminStats() {
const [adminData, setAdminData] = useState(null);

useEffect(() => {
    const fetchAdminStats = async () => {
        const response = await axios.get('/api/reports/admin-stats/');
        setAdminData(response.data);
    };
    fetchAdminStats();
}, []);

// In your return, display these as big "Stat Cards"
return (
    <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow rounded-xl">
            <h3>Monthly Orders</h3>
            <p className="text-4xl font-bold">{adminData?.total_orders_month}</p>
        </div>
        <div className="p-6 bg-white shadow rounded-xl border-l-4 border-red-500">
            <h3>Total Overdue</h3>
            <p className="text-4xl font-bold text-red-600">{adminData?.total_overdue}</p>
        </div>
    </div>
);
}
export default AdminStats