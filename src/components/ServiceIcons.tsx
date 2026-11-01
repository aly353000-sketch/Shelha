import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Custom High-Quality SVG Icons for Shilha Moving Services
 * Handcrafted with gradients, depth, and moving industry symbolism.
 */

// 1. Residential Moving (Home & Villa luxury furniture moving)
export const ResidentialMovingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="resHomeGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="resRoofGrad" x1="32" y1="6" x2="32" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    {/* Roof */}
    <path
      d="M32 8L6 28H14V54C14 55.1 14.9 56 16 56H48C49.1 56 50 55.1 50 54V28H58L32 8Z"
      fill="url(#resRoofGrad)"
      opacity="0.2"
    />
    <path
      d="M32 8L6 28H14V54C14 55.1 14.9 56 16 56H48C49.1 56 50 55.1 50 54V28H58L32 8Z"
      stroke="url(#resHomeGrad)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Doorway / Moving box entering */}
    <rect
      x="24"
      y="34"
      width="16"
      height="22"
      rx="2"
      stroke="url(#resHomeGrad)"
      strokeWidth="3"
      fill="url(#resRoofGrad)"
      fillOpacity="0.3"
    />
    {/* Moving box icon inside */}
    <path
      d="M28 42H36M28 48H36"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Sparkling star */}
    <path
      d="M48 16L49.5 20.5L54 22L49.5 23.5L48 28L46.5 23.5L42 22L46.5 20.5L48 16Z"
      fill="#FBBF24"
    />
  </svg>
);

// 2. Corporate & Office Moving (Commercial towers, workstations, server racks)
export const CorporateMovingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="corpGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="corpGlass" x1="20" y1="12" x2="44" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0EA5E9" stopOpacity="0.25" />
        <stop offset="1" stopColor="#1E3A8A" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    {/* Secondary Building */}
    <rect
      x="10"
      y="24"
      width="16"
      height="32"
      rx="2"
      fill="url(#corpGlass)"
      stroke="url(#corpGrad)"
      strokeWidth="3"
    />
    {/* Main Tower */}
    <rect
      x="26"
      y="10"
      width="28"
      height="46"
      rx="3"
      fill="url(#corpGlass)"
      stroke="url(#corpGrad)"
      strokeWidth="3.5"
    />
    {/* Windows Matrix */}
    <rect x="32" y="16" width="6" height="5" rx="1" fill="#38BDF8" />
    <rect x="42" y="16" width="6" height="5" rx="1" fill="#38BDF8" />
    <rect x="32" y="25" width="6" height="5" rx="1" fill="#38BDF8" opacity="0.8" />
    <rect x="42" y="25" width="6" height="5" rx="1" fill="#38BDF8" opacity="0.8" />
    <rect x="32" y="34" width="6" height="5" rx="1" fill="#38BDF8" opacity="0.6" />
    <rect x="42" y="34" width="6" height="5" rx="1" fill="#38BDF8" opacity="0.6" />
    {/* Entrance Door */}
    <path
      d="M36 56V47H44V56"
      stroke="#38BDF8"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Small building windows */}
    <circle cx="18" cy="30" r="2" fill="#38BDF8" />
    <circle cx="18" cy="38" r="2" fill="#38BDF8" />
    <circle cx="18" cy="46" r="2" fill="#38BDF8" />
  </svg>
);

// 3. Hydraulic Winch Lift (Telescopic arm & high-floor lift basket)
export const HydraulicWinchIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="winchGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="ladderGrad" x1="20" y1="10" x2="48" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    {/* Truck base */}
    <path
      d="M8 48H44L48 42H56V48H58"
      stroke="url(#winchGrad)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Truck wheels */}
    <circle cx="18" cy="50" r="4" fill="#0F172A" stroke="url(#winchGrad)" strokeWidth="3" />
    <circle cx="46" cy="50" r="4" fill="#0F172A" stroke="url(#winchGrad)" strokeWidth="3" />
    {/* Winch Turntable */}
    <rect x="14" y="42" width="12" height="6" rx="2" fill="#D97706" />
    {/* Extended Telescopic Ladder Rail */}
    <line x1="20" y1="42" x2="48" y2="10" stroke="url(#ladderGrad)" strokeWidth="4" strokeLinecap="round" />
    <line x1="24" y1="45" x2="52" y2="13" stroke="url(#ladderGrad)" strokeWidth="4" strokeLinecap="round" />
    {/* Ladder Rungs */}
    <line x1="23" y1="39" x2="27" y2="42" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="29" y1="32" x2="33" y2="35" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="36" y1="24" x2="40" y2="27" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="43" y1="16" x2="47" y2="19" stroke="#38BDF8" strokeWidth="2.5" />
    {/* Lift Basket with Furniture at High Elevation */}
    <rect
      x="44"
      y="6"
      width="14"
      height="10"
      rx="2"
      fill="#F59E0B"
      stroke="#FDE68A"
      strokeWidth="2"
    />
    {/* Upward arrows indicator */}
    <path
      d="M51 13V9M49 11L51 9L53 11"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 4. Premium Protective Packaging (Multi-layer box, bubble wrap, shrink film, tape)
export const ProtectivePackagingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="packGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="boxInner" x1="14" y1="20" x2="50" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0369A1" stopOpacity="0.3" />
        <stop offset="1" stopColor="#0C4A6E" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    {/* 3D Isometric Moving Box */}
    <path
      d="M32 10L52 21V43L32 54L12 43V21L32 10Z"
      fill="url(#boxInner)"
      stroke="url(#packGrad)"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M32 10V54"
      stroke="url(#packGrad)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M12 21L32 32L52 21"
      stroke="url(#packGrad)"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Packaging Tape Across Top Flaps */}
    <path
      d="M24 14.5L40 47.5"
      stroke="#F59E0B"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Bubble wrap protective texture dots */}
    <circle cx="22" cy="30" r="2" fill="#38BDF8" />
    <circle cx="26" cy="35" r="2" fill="#38BDF8" />
    <circle cx="20" cy="38" r="2" fill="#38BDF8" />
    {/* Fragile Glass Seal Badge */}
    <circle cx="42" cy="34" r="5" fill="#EF4444" />
    <path d="M40 32H44V34L43 36H41L40 34V32Z" fill="#FFFFFF" />
  </svg>
);

// 5. AC & Electrical Technician (Air conditioner, freon gauge, tools & installation)
export const AcTechnicianIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="acGrad" x1="10" y1="12" x2="54" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    {/* AC Indoor Wall Unit */}
    <rect
      x="10"
      y="14"
      width="44"
      height="22"
      rx="4"
      fill="#0F172A"
      stroke="url(#acGrad)"
      strokeWidth="3.5"
    />
    {/* Air vent slats */}
    <line x1="16" y1="26" x2="48" y2="26" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="30" x2="48" y2="30" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    {/* Digital LED Display */}
    <rect x="42" y="18" width="6" height="4" rx="1" fill="#10B981" />
    {/* Cold airflow cool breeze waves */}
    <path
      d="M20 40C20 44 24 46 28 46M28 40C28 45 32 48 36 48M36 40C36 46 40 50 44 50"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />
    {/* Technician Wrench Tool crossed */}
    <g transform="translate(18, 42)">
      <circle cx="20" cy="10" r="6" fill="#F59E0B" />
      <path
        d="M17 7L23 13M23 7L17 13"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

// 6. Covered Padded Moving Trucks (Closed cabin, padded interior for long distance)
export const CoveredTruckIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="truckGrad" x1="8" y1="14" x2="56" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="cargoBox" x1="10" y1="16" x2="38" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0369A1" stopOpacity="0.25" />
        <stop offset="1" stopColor="#1E3A8A" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    {/* Closed Padded Cargo Box */}
    <rect
      x="8"
      y="16"
      width="32"
      height="26"
      rx="3"
      fill="url(#cargoBox)"
      stroke="url(#truckGrad)"
      strokeWidth="3.5"
    />
    {/* Cabin Front */}
    <path
      d="M40 24H50L56 32V42H40V24Z"
      fill="#0F172A"
      stroke="url(#truckGrad)"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Cabin Window */}
    <path
      d="M42 27H49L53 33H42V27Z"
      fill="#38BDF8"
      opacity="0.8"
    />
    {/* Wheels */}
    <circle cx="18" cy="46" r="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
    <circle cx="48" cy="46" r="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
    <circle cx="18" cy="46" r="2" fill="#38BDF8" />
    <circle cx="48" cy="46" r="2" fill="#38BDF8" />
    {/* Speed Lines */}
    <line x1="2" y1="22" x2="5" y2="22" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="1" y1="28" x2="5" y2="28" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="3" y1="34" x2="5" y2="34" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
