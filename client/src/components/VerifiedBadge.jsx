import { Shield } from 'lucide-react';

export function VerifiedBadge({ size = 'md', showTooltip = true }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-7 h-7'
  };

  return (
    <div className="relative inline-flex group">
      <svg 
        className={`${sizes[size]} transition-transform group-hover:scale-110`}
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer glow effect */}
        <circle cx="12" cy="12" r="11" fill="#3B82F6" opacity="0.2" className="group-hover:opacity-30 transition-opacity"/>
        {/* Main circle */}
        <circle cx="12" cy="12" r="10" fill="#3B82F6"/>
        {/* Checkmark */}
        <path 
          d="M8 12L11 15L16 9" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Tooltip - only show if showTooltip is true */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
          Verified Creator
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

export function AdminBadge({ size = 'md', showTooltip = true }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-7 h-7'
  };

  return (
    <div className="relative inline-flex group">
      <div className="relative">
        {/* Outer glow effect */}
        <div className={`absolute inset-0 ${sizes[size]} bg-yellow-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity`}></div>
        {/* Shield icon */}
        <Shield 
          className={`${sizes[size]} text-yellow-500 fill-yellow-500 relative z-10 transition-transform group-hover:scale-110 drop-shadow-lg`}
        />
      </div>
      
      {/* Tooltip - only show if showTooltip is true */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl border border-yellow-500/30">
          <span className="text-yellow-400">Admin</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
