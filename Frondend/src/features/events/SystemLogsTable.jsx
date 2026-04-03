import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';

function SystemLogsTable() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        axios.get('/api/settings/logs/')
            .then(res => setLogs(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Security & Audit Logs</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="text-gray-400 uppercase text-[10px] font-bold">
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Action performed</th>
                        <th className="px-6 py-3">IP Address</th>
                        <th className="px-6 py-3">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{log.user_email || 'System'}</td>
                            <td className="px-6 py-4 text-gray-600">{log.action}</td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{log.ip_address}</td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default SystemLogsTable;