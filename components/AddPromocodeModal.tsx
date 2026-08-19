import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface AddPromocodeModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AddPromocodeModal: React.FC<AddPromocodeModalProps> = ({ onClose, onSave }) => {
    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState<number | ''>('');
    const [limit, setLimit] = useState<number | ''>('');
    const [expiresAt, setExpiresAt] = useState('');

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ code, type, value, limit: limit || null, expiresAt });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-orange-500/30 rounded-lg shadow-xl w-full max-w-lg m-4 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-orange-500">Yangi Promokod</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Yopish">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">Promokod</label>
                        <div className="flex gap-2">
                            <input id="code" type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required className="flex-grow w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono" />
                            <button type="button" onClick={generateCode} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold text-sm transition-colors">Generatsiya</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">Chegirma turi</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                <option value="percentage">Foizda (%)</option>
                                <option value="fixed">So'mda (UZS)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-300 mb-2">Miqdori</label>
                            <input id="value" type="number" value={value} onChange={e => setValue(Number(e.target.value))} required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="limit" className="block text-sm font-medium text-gray-300 mb-2">Limit (bo'sh qoldiring - cheksiz)</label>
                            <input id="limit" type="number" placeholder="100" value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="expires" className="block text-sm font-medium text-gray-300 mb-2">Amal qilish muddati</label>
                            <input id="expires" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors">Bekor qilish</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md font-semibold transition-colors">Saqlash</button>
                </div>
            </div>
        </div>
    );
};