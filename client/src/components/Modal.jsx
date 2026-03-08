import React from 'react';
import { X } from 'lucide-react';

// Confirm Dialog
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'default' }) {
  if (!isOpen) return null;

  const typeStyles = {
    default: 'bg-netflix hover:bg-red-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition ${typeStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Prompt Dialog (with input)
export function PromptModal({ isOpen, onClose, onSubmit, title, message, placeholder = '', options = null }) {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">{message}</p>
            
            {options ? (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      onSubmit(option.value);
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-400 mt-1">{option.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-netflix transition"
                autoFocus
              />
            )}
          </div>

          {/* Actions */}
          {!options && (
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!value.trim()}
                className="flex-1 px-4 py-2.5 bg-netflix hover:bg-red-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Alert Dialog
export function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null;

  const typeConfig = {
    info: { icon: 'ℹ️', color: 'text-blue-400' },
    success: { icon: '✓', color: 'text-green-400' },
    warning: { icon: '⚠️', color: 'text-yellow-400' },
    error: { icon: '✕', color: 'text-red-400' }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl border border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${config.color}`}>{config.icon}</span>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-netflix hover:bg-red-700 rounded-lg font-medium transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}


