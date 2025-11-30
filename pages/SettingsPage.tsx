import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { StorageService } from '../services/storage';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: '', address: '', taxId: '', phone: '', footerMessage: '', vatRate: 7
  });

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    alert("Settings saved!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">System Settings</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">Company Name</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded-lg"
            value={settings.companyName}
            onChange={e => setSettings({...settings, companyName: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">Address</label>
          <textarea 
            className="w-full p-2 border rounded-lg"
            rows={3}
            value={settings.address}
            onChange={e => setSettings({...settings, address: e.target.value})} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Tax ID</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-lg"
                value={settings.taxId}
                onChange={e => setSettings({...settings, taxId: e.target.value})} 
            />
            </div>
            <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Phone</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-lg"
                value={settings.phone}
                onChange={e => setSettings({...settings, phone: e.target.value})} 
            />
            </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">Receipt Footer Message</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded-lg"
            value={settings.footerMessage}
            onChange={e => setSettings({...settings, footerMessage: e.target.value})} 
          />
        </div>
         <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">VAT Rate (%)</label>
          <input 
            type="number" 
            className="w-24 p-2 border rounded-lg"
            value={settings.vatRate}
            onChange={e => setSettings({...settings, vatRate: Number(e.target.value)})} 
          />
        </div>

        <button type="submit" className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition">
          <Save size={18} /> Save Settings
        </button>
      </form>
    </div>
  );
}