import React, { useState } from 'react';
import axios from 'axios';

const ProductVerification = ({ product, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state based on your specific models
    const [formData, setFormData] = useState({
        is_passed: true,
        comments: '',
        // FoodVerification fields
        batch_lot: '',
        temp_chain_ok: true,
        packaging_sealed: true,
        fssai_verified: true,
        // FurnitureVerification fields
        structural_ok: true,
        finish_no_scratches: true,
        parts_complete: true,
        // ElectronicsVerification fields
        unique_serial_number: '',
        boot_test_passed: false,
        ports_physical_ok: true,
        firmware_version: '',
        // StationeryVerification fields
        quantity_reconciled: true,
        ink_lead_test_passed: true,
        paper_not_damaged: true,
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use your exact registered router path
            await axios.post('/api/inventory/verify-products/', {
                product: product.id,
                ...formData
            });
            alert('Verification Submitted Successfully!');
            if (onComplete) onComplete();
        } catch (err) {
            // This captures the specific field errors from your Django ValidationError
            setError(err.response?.data || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    if (!product) return <p>Please select a product to verify.</p>;

    const dept = product.department_name?.toLowerCase();

    return (
        <div className="p-6 bg-white rounded shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
                Verification: <span className="text-blue-500">{product.department_name}</span>
            </h2>
            <p className="mb-4 text-gray-600">Product: <strong>{product.name}</strong> (SKU: {product.sku})</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Base Verification Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold">Inspection Result</label>
                        <select 
                            name="is_passed" 
                            value={formData.is_passed} 
                            onChange={handleInputChange}
                            className="w-full border rounded p-2 mt-1"
                        >
                            <option value={true}>PASS (In Stock)</option>
                            <option value={false}>FAIL (Quarantine/Damage)</option>
                        </select>
                    </div>
                </div>

                {/* Dynamic Fields based on Department */}
                {dept === 'food' && (
                    <div className="p-4 bg-blue-50 rounded space-y-3">
                        <input type="text" name="batch_lot" placeholder="Batch/Lot Number" onChange={handleInputChange} className="w-full border p-2 rounded" required />
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="checkbox" name="temp_chain_ok" checked={formData.temp_chain_ok} onChange={handleInputChange} /> Temp OK</label>
                            <label className="flex items-center gap-2"><input type="checkbox" name="packaging_sealed" checked={formData.packaging_sealed} onChange={handleInputChange} /> Sealed</label>
                        </div>
                    </div>
                )}

                {dept === 'electronics' && (
                    <div className="p-4 bg-green-50 rounded space-y-3">
                        <input type="text" name="unique_serial_number" placeholder="Unique Serial Number" onChange={handleInputChange} className="w-full border p-2 rounded" required />
                        <input type="text" name="firmware_version" placeholder="Firmware Version" onChange={handleInputChange} className="w-full border p-2 rounded" />
                        <label className="flex items-center gap-2"><input type="checkbox" name="boot_test_passed" checked={formData.boot_test_passed} onChange={handleInputChange} /> Power On (DOA) Test Pass</label>
                    </div>
                )}

                {dept === 'furniture' && (
                    <div className="p-4 bg-amber-50 rounded space-y-3">
                        <label className="flex items-center gap-2"><input type="checkbox" name="structural_ok" checked={formData.structural_ok} onChange={handleInputChange} /> Structural Integrity Passed</label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="finish_no_scratches" checked={formData.finish_no_scratches} onChange={handleInputChange} /> No Physical Scratches</label>
                    </div>
                )}

                {dept === 'stationery' && (
                    <div className="p-4 bg-purple-50 rounded space-y-3">
                        <label className="flex items-center gap-2"><input type="checkbox" name="quantity_reconciled" checked={formData.quantity_reconciled} onChange={handleInputChange} /> Quantity Count Correct</label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="ink_lead_test_passed" checked={formData.ink_lead_test_passed} onChange={handleInputChange} /> Ink/Lead Quality Pass</label>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold">Comments</label>
                    <textarea name="comments" value={formData.comments} onChange={handleInputChange} className="w-full border rounded p-2 mt-1" rows="3" placeholder="Describe inspection details..."></textarea>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                        {typeof error === 'object' ? Object.entries(error).map(([key, val]) => `${key}: ${val}`).join(', ') : error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                    {loading ? 'Processing...' : 'Submit Verification Record'}
                </button>
            </form>
        </div>
    );
};

export default ProductVerification;