import React, { useState, useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { Notification, NotificationType } from '../types';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ExclamationCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const InfoCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);


const icons: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircleIcon />,
    error: <XCircleIcon />,
    warning: <ExclamationCircleIcon />,
    info: <InfoCircleIcon />,
};

const colors: Record<NotificationType, string> = {
    success: 'border-green-500 text-green-400',
    error: 'border-red-500 text-red-400',
    warning: 'border-yellow-500 text-yellow-400',
    info: 'border-blue-500 text-blue-400',
};


const NotificationToast: React.FC<{ notification: Notification; onClose: (id: string) => void }> = ({ notification, onClose }) => {
    const [exiting, setExiting] = useState(false);
    const [width, setWidth] = useState(100);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onClose(notification.id), 400); // Wait for exit animation
        }, 5000);

        const progressInterval = setInterval(() => {
            setWidth(prev => Math.max(0, prev - (100 / 50))); // 100% over 5 seconds (50 * 100ms)
        }, 100);

        return () => {
            clearTimeout(exitTimer);
            clearInterval(progressInterval);
        };
    }, [notification.id, onClose]);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onClose(notification.id), 400);
    };

    return (
        <div className={`
            relative flex items-start w-full max-w-sm p-4 my-2 overflow-hidden bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg border-l-4 transition-all duration-300
            ${colors[notification.type]}
            ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        `}>
            <div className="flex-shrink-0">{icons[notification.type]}</div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
            </div>
            <button onClick={handleClose} className="ml-4 flex-shrink-0 text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-50" style={{ width: `${width}%`, transition: 'width 100ms linear' }}></div>
        </div>
    );
};


export const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-5 right-5 z-[1000] w-full max-w-sm">
            {notifications.map(notification => (
                <NotificationToast key={notification.id} notification={notification} onClose={removeNotification} />
            ))}
        </div>
    );
};
