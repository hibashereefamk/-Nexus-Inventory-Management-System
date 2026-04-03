import React from 'react';
import { 
  HelpCircle, 
  User, 
  ShieldCheck, 
  AlertOctagon, 
  ArrowRight, 
  MessageSquare,
  Package
} from 'lucide-react';

const HelpPage = () => {
  const sections = [
    {
      role: "Staff Member",
      icon: <User className="text-blue-500" />,
      instructions: [
        "Departmental Reporting: Log food items with specific dates and expiry data.",
        "Shipment Workflow: Submit 'Shipment' reports and send completion notifications.",
        "Furniture Tracking: Log quantity, damages, and dates (triggers automatic email alerts).",
        "Overdue Monitoring: Check personal dashboard for pending tasks."
      ]
    },
    {
      role: "Manager",
      icon: <Package className="text-purple-500" />,
      instructions: [
        "Staff Assignment: Use the 'Recur/Assign' tool to distribute tasks to staff.",
        "Report Review: Validate Damage, Overdue, and Emergency reports before escalation.",
        "Reason Verification: Check 'Reason' fields on staff reports for accuracy."
      ]
    },
    {
      role: "HR & Admin Control",
      icon: <ShieldCheck className="text-green-500" />,
      instructions: [
        "Analytics: Monitor daily, monthly, and yearly order totals.",
        "System Health: Track background tasks via Celery & Redis application status.",
        "Chat Monitoring: Access communication logs for departmental coordination.",
        "Overdue Oversight: Direct view of all 'Critical Overdue' items across the system."
      ]
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-3">
            <HelpCircle size={32} className="text-blue-600" /> System Help & Documentation
          </h1>
          <p className="text-gray-500 mt-2">Inventory Management Workflow & Role Guidelines</p>
        </header>

        {/* Workflow Logic Section */}
        <div className="mb-12 bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertOctagon size={20} /> Escalation Workflow (Damage Reports)
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-semibold">
            <div className="bg-white/20 p-3 rounded-lg px-6">STAFF: Log Damage</div>
            <ArrowRight />
            <div className="bg-white/20 p-3 rounded-lg px-6">MANAGER: Verify Reason</div>
            <ArrowRight />
            <div className="bg-white/20 p-3 rounded-lg px-6">ADMIN: Final Approval</div>
          </div>
        </div>

        {/* Role Specific Help */}
        <div className="grid gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {section.icon}
                <h3 className="text-xl font-bold text-gray-800">{section.role}</h3>
              </div>
              <ul className="space-y-3">
                {section.instructions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-blue-500 font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* System & Rough Data Reference */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <MessageSquare size={18} /> Quick Monitor Guide
            </h4>
            <div className="text-xs text-amber-700 space-y-1 font-mono">
              <p>26: System Alerts</p>
              <p>27: Packing & Monitoring</p>
              <p>28: Shipment & Tracking</p>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl text-white">
            <h4 className="font-bold mb-2">Backend Infrastructure</h4>
            <p className="text-sm text-gray-400">
              This application uses <strong>Celery</strong> and <strong>Redis</strong> to handle 
              asynchronous reports (Email alerts and Emergency notifications). 
              Ensure services are running for real-time updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;