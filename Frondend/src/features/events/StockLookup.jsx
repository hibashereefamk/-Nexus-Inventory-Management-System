import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, DollarSign, Package, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function StockLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      // Using search parameter for Django Rest Framework filters
      const res = await axios.get(`${API_BASE}/api/inventory/products/`, {
        params: { search: query },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle both paginated and non-paginated DRF responses
      const data = res.data.results ? res.data.results : res.data;
      setResults(data);
      
      if (data.length === 0) {
        setError("No products found matching your search.");
      }
    } catch (err) {
      console.error("Search failed", err);
      setError(err.response?.status === 401 
        ? "Session expired. Please log in again." 
        : "Failed to fetch inventory. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-slate-50/50">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Stock Lookup</h1>
        <p className="text-slate-500 mt-1">Quickly check product availability and warehouse locations.</p>
      </header>
      
      {/* Search Bar Section */}
      <form onSubmit={handleSearch} className="relative mb-10 group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
        </div>
        
        <input 
          type="text" 
          placeholder="Search by Product Name, SKU, or Category..." 
          className="w-full p-5 pl-14 pr-32 bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-3 top-3 bottom-3 bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all uppercase text-sm tracking-wider"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">
                  {product.category || 'General'}
                </p>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                {product.sku || 'NO SKU'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Package size={18} className="text-blue-500" />
                  <span>Available Stock</span>
                </div>
                <span className={`font-black text-lg ${product.stock_quantity > 0 ? 'text-slate-800' : 'text-red-500'}`}>
                  {product.stock_quantity}
                </span>
              </div>

              <div className="flex items-center gap-3 px-3 text-sm text-slate-500">
                <MapPin size={18} className="text-orange-500" />
                <span>Location: <strong className="text-slate-800">{product.warehouse_location || 'Aisle 4, Shelf B'}</strong></span>
              </div>

              <div className="flex items-center gap-3 px-3 text-sm text-slate-500">
                <DollarSign size={18} className="text-emerald-500" />
                <span>Unit Price: <strong className="text-slate-800">${Number(product.price).toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {results.length === 0 && !loading && !error && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-400" size={32} />
            </div>
            <h3 className="text-slate-800 font-bold text-lg">No Items to Display</h3>
            <p className="text-slate-400">Enter a keyword above to check inventory levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockLookup;