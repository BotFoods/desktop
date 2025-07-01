import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../services/NotificationContext';
import { 
    FaTimes, FaExclamationTriangle, FaInfoCircle, 
    FaCheckCircle, FaCreditCard, FaClock 
} from 'react-icons/fa';

const NotificationBanner = () => {
    const navigate = useNavigate();
    const { getPersistentNotifications, removeNotification, markAsRead } = useNotifications();
    
    const notifications = getPersistentNotifications();

    if (notifications.length === 0) {
        return null;
    }

    const getNotificationIcon = (severity) => {
        switch (severity) {
            case 'error':
                return <FaExclamationTriangle className="text-red-400" />;
            case 'warning':
                return <FaClock className="text-yellow-400" />;
            case 'success':
                return <FaCheckCircle className="text-green-400" />;
            default:
                return <FaInfoCircle className="text-blue-400" />;
        }
    };

    const getNotificationColors = (severity) => {
        switch (severity) {
            case 'error':
                return 'bg-red-500/20 border-red-500 text-red-100';
            case 'warning':
                return 'bg-yellow-500/20 border-yellow-500 text-yellow-100';
            case 'success':
                return 'bg-green-500/20 border-green-500 text-green-100';
            default:
                return 'bg-blue-500/20 border-blue-500 text-blue-100';
        }
    };

    const handleActionClick = (notification) => {
        if (notification.action?.path) {
            navigate(notification.action.path);
        }
        markAsRead(notification.id);
    };

    const handleDismiss = (notification) => {
        removeNotification(notification.id);
    };

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`mb-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg ${getNotificationColors(notification.severity)}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-0.5">
                            {getNotificationIcon(notification.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1">
                                {notification.title}
                            </h4>
                            <p className="text-xs opacity-90 mb-3">
                                {notification.message}
                            </p>
                            
                            {notification.action && (
                                <button
                                    onClick={() => handleActionClick(notification)}
                                    className="inline-flex items-center px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors duration-200"
                                >
                                    <FaCreditCard className="mr-1" />
                                    {notification.action.label}
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => handleDismiss(notification)}
                            className="flex-shrink-0 ml-2 p-1 hover:bg-white/20 rounded transition-colors duration-200"
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente para mostrar badge de notificações no menu
export const NotificationBadge = () => {
    const { getUnreadCount } = useNotifications();
    const unreadCount = getUnreadCount();

    if (unreadCount === 0) {
        return null;
    }

    return (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    );
};

export default NotificationBanner;