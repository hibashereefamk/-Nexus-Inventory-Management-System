import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Phone, AlignLeft, Save, Edit3, X } from 'lucide-react';

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', phone: '', bio: ''
    });

    // Load initial data
    useEffect(() => {
        axios.get('/api/profile/').then(res => {
            setFormData({
                first_name: res.data.first_name,
                last_name: res.data.last_name,
                phone: res.data.phone || '',
                bio: res.data.bio || ''
            });
        });
    }, []);

    const handleSave = async () => {
        try {
            await axios.patch('/api/profile/update/', formData);
            setIsEditing(false);
            alert("Profile Updated!");
        } catch (err) {
            alert("Error saving profile");
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border mt-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">My Nexus Profile</h2>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition"
                >
                    {isEditing ? <><X size={16}/> Cancel</> : <><Edit3 size={16}/> Edit Profile</>}
                </button>
            </div>

            <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">First Name</label>
                        {isEditing ? (
                            <input 
                                className="w-full p-2 border rounded-md mt-1" 
                                value={formData.first_name}
                                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            />
                        ) : <p className="text-lg font-medium py-2">{formData.first_name}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Last Name</label>
                        {isEditing ? (
                            <input 
                                className="w-full p-2 border rounded-md mt-1" 
                                value={formData.last_name}
                                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            />
                        ) : <p className="text-lg font-medium py-2">{formData.last_name}</p>}
                    </div>
                </div>

                {/* Phone Field */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Phone size={14}/> Phone Number
                    </label>
                    {isEditing ? (
                        <input 
                            className="w-full p-2 border rounded-md mt-1" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    ) : <p className="text-lg font-medium py-2">{formData.phone || 'Not set'}</p>}
                </div>

                {/* Bio Field */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                        <AlignLeft size={14}/> Professional Bio
                    </label>
                    {isEditing ? (
                        <textarea 
                            className="w-full p-2 border rounded-md mt-1 h-32" 
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        />
                    ) : <p className="text-gray-600 py-2 italic">"{formData.bio || 'No bio added yet...'}"</p>}
                </div>

                {isEditing && (
                    <button 
                        onClick={handleSave}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Save size={18}/> Save Changes
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;