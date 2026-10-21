import React, { useState } from 'react';
import axios from 'axios';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick prompt templates for inventory managers (ERP Command shortcuts)
  const quickPrompts = [
    "Show me products that have low inventory or need attention",
    "List all stock items currently at zero stock",
    "Audit warehouse bin locations and anomalies",
    "Generate summary report of current inventory health"
  ];

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    const newChat = [...chatLog, { sender: 'user', text: textToSend }];
    setChatLog(newChat);
    setPrompt('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        'http://127.0.0.1:8000/api/inventory/ai-assistant/', 
        { prompt: textToSend },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setChatLog([...newChat, { sender: 'ai', text: res.data.response }]);
    } catch (err) {
      console.error("AXIOS ERROR DETAILS:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Error connecting to Nexus AI backend.';
      setChatLog([...newChat, { sender: 'ai', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Uses h-[calc(100vh-theme(spacing.12))] or w-full flex-1 to fill the window space dynamically */
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] max-w-7xl mx-auto bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans my-auto">
      
      {/* 1. ERP Enterprise Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <div>
            <h2 className="text-base font-bold tracking-wide text-slate-900 flex items-center gap-2">
              NEXUS <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-semibold">ERP COCKPIT</span>
            </h2>
            <p className="text-xs text-slate-500">Autonomous Inventory Intelligence & Warehouse Analytics</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm font-medium">Role: Manager / Admin</span>
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg shadow-sm font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure JWT Active
          </span>
        </div>
      </div>

      {/* 2. Main Layout Area (Fluid Flex Fill) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Chat Feed Container */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/40 p-6 overflow-hidden">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
            
            {/* Empty State & Quick Shortcuts */}
            {chatLog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-600 font-bold text-xl shadow-sm">
                  AI
                </div>
                <h3 className="text-sm font-bold text-slate-800">Nexus ERP Assistant Ready</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Query stock levels, track perishable expirations, or check bin allocations instantly using professional natural language operations.
                </p>
                
                {/* Quick Suggestion Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 w-full text-left">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(qp)}
                      className="text-xs bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-slate-700 p-3 rounded-xl transition-all shadow-sm flex items-center gap-2 group"
                    >
                      <span className="text-blue-500 group-hover:scale-110 transition-transform">⚡</span>
                      <span className="font-medium">{qp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Log Feed */}
            {chatLog.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 px-1 font-semibold">
                  {msg.sender === 'user' ? 'You (Operator)' : 'Nexus ERP Intelligence'}
                </div>
                <div className={`max-w-4xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none font-mono text-[13px]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-xl w-fit shadow-sm animate-pulse">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                Querying PostgreSQL database & generating enterprise neural analytics...
              </div>
            )}
          </div>

          {/* 3. Input Controls Bar */}
          <div className="mt-4 pt-4 border-t border-slate-200 bg-transparent shrink-0">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about inventory metrics, low stock items, or location audits..."
                className="flex-1 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                <span>Execute</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}