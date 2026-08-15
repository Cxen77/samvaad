import React, { useState, useEffect, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:top-4 md:bottom-auto md:right-4 md:left-auto md:translate-x-0 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 md:px-0">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

ToastProvider.propTypes = {
    children: PropTypes.node.isRequired
};

const Toast = ({ message, type, duration, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-sky-50 border-sky-200 text-sky-800'
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info
    };

    const Icon = icons[type] || Info;

    return (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-bottom-5 md:slide-in-from-right-5 fade-in duration-300 ${styles[type]}`}>
            <Icon size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition">
                <X size={16} />
            </button>
        </div>
    );
};
