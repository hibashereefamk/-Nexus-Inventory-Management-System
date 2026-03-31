import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, DollarSign, Package } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function StockLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE}/api/inventory/products/?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-6">Stock Lookup</h1>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative mb-10">
        <input 
          type="text" 
          placeholder="Search by Product Name, SKU, or Category..." 
          className="w-full p-5 pl-14 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-blue-500 outline-none transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute left-5 top-5 text-slate-400" size={24} />
        <button type="submit" className="absolute right-3 top-3 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">
          SEARCH
        </button>
      </form>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{product.sku || 'NO SKU'}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Package size={16} className="text-blue-500" />
                <span>In Stock: <strong className="text-slate-800">{product.stock_quantity}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <MapPin size={16} className="text-orange-500" />
                <span>Location: <strong className="text-slate-800">{product.warehouse_location || 'Aisle 4, Shelf B'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <DollarSign size={16} className="text-emerald-500" />
                <span>Unit Price: <strong className="text-slate-800">${product.price}</strong></span>
              </div>
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-slate-400 italic">Enter a keyword to start searching...</div>
        )}
      </div>
    </div>
  );
}

export default StockLookup;