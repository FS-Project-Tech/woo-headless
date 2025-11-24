export default function ServiceFeatures() {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          {/* Delivery truck */}
          <rect x="2" y="7" width="16" height="10" rx="1" />
          <path d="M6 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1v3" />
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M18 17h-2M6 17H4" />
          {/* Clock icon on side */}
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 10v2l1.5 1.5" />
        </svg>
      ),
      label: "1-5 business days"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          {/* Storefront */}
          <rect x="3" y="11" width="18" height="10" rx="1" />
          <path d="M3 11V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
          <path d="M7 11V9M17 11V9" />
          <path d="M12 11V9" />
          <path d="M9 21v-6M15 21v-6" />
        </svg>
      ),
      label: "Store Pickup"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          {/* Wallet */}
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M9 14h6" />
          {/* Checkmark */}
          <path d="M13 10l2 2 4-4" strokeWidth="2" />
        </svg>
      ),
      label: "NDIS Payment option"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          {/* Australia map outline with dots pattern */}
          <path d="M4 8c0-2 2-4 4-4s4 2 4 4c0 1-1 2-2 3M16 8c0-2-2-4-4-4s-4 2-4 4c0 1 1 2 2 3" />
          <path d="M6 12c2 1 4 1 6 0s4-1 6 0" />
          <path d="M8 16c1 1 2 2 4 2s3-1 4-2" />
          <circle cx="8" cy="10" r="0.8" fill="currentColor" />
          <circle cx="16" cy="10" r="0.8" fill="currentColor" />
          <circle cx="12" cy="14" r="0.8" fill="currentColor" />
          <circle cx="10" cy="16" r="0.5" fill="currentColor" />
          <circle cx="14" cy="16" r="0.5" fill="currentColor" />
        </svg>
      ),
      label: "Australia Wide Delivery"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          {/* Headphones */}
          <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
          <path d="M3 14v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2M21 14v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2" />
          <circle cx="7" cy="16" r="2" />
          <circle cx="17" cy="16" r="2" />
        </svg>
      ),
      label: "24/7 Customer Support"
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="group flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="text-teal-700 mb-2">
              {feature.icon}
            </div>
            <p className="text-xs font-medium text-gray-700 leading-tight">
              {feature.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

