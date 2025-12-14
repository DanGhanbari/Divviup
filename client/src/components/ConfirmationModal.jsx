import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'Delete' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            type === 'danger' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                        )}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>

                    <p className="text-slate-600 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={clsx("flex-1 px-4 py-2 text-white rounded-lg font-medium transition shadow-sm",
                                type === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"
                            )}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
