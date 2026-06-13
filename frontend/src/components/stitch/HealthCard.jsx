import React from 'react';

const GRADE_CONFIG = {
  A: { label: 'Excellent', color: '#15803d', bg: '#dcfce7', ring: '#16a34a', bar: 95, barColor: '#16a34a' },
  B: { label: 'Good',      color: '#92400e', bg: '#fef3c7', ring: '#d97706', bar: 75, barColor: '#d97706' },
  C: { label: 'Fair',      color: '#9a3412', bg: '#ffedd5', ring: '#ea580c', bar: 55, barColor: '#ea580c' },
  D: { label: 'Acceptable',color: '#7f1d1d', bg: '#fee2e2', ring: '#dc2626', bar: 35, barColor: '#dc2626' },
};

const CIRCUMFERENCE = 2 * Math.PI * 28; // r=28

const GradeRing = ({ grade, config }) => {
  const filled = (config.bar / 100) * CIRCUMFERENCE;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Background ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={config.ring}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        {/* Grade letter */}
        <div
          className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm"
          style={{ background: config.bg, color: config.ring }}
        >
          {grade}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: config.ring }}>
          {config.label}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">AI Condition Grade</p>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, percent, color }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-xs font-bold text-gray-700">{value}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, background: color, transition: 'width 0.6s ease' }}
      />
    </div>
  </div>
);

const CheckPill = ({ text, ok = true }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border
    ${ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
    {ok ? '✓' : '✗'} {text}
  </span>
);

const QRCode = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0 rounded">
    <rect width="52" height="52" fill="white" />
    {/* Top-left finder */}
    <rect x="2"  y="2"  width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="4"  y="4"  width="11" height="11" rx="0.5" fill="white"/>
    <rect x="6"  y="6"  width="7"  height="7"  fill="#131921"/>
    {/* Top-right finder */}
    <rect x="35" y="2"  width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="37" y="4"  width="11" height="11" rx="0.5" fill="white"/>
    <rect x="39" y="6"  width="7"  height="7"  fill="#131921"/>
    {/* Bottom-left finder */}
    <rect x="2"  y="35" width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="4"  y="37" width="11" height="11" rx="0.5" fill="white"/>
    <rect x="6"  y="39" width="7"  height="7"  fill="#131921"/>
    {/* Data modules */}
    <rect x="20" y="2"  width="4" height="4" fill="#131921"/>
    <rect x="26" y="2"  width="4" height="4" fill="#131921"/>
    <rect x="20" y="8"  width="4" height="4" fill="#131921"/>
    <rect x="26" y="8"  width="4" height="4" fill="#131921"/>
    <rect x="20" y="20" width="4" height="4" fill="#131921"/>
    <rect x="26" y="14" width="4" height="4" fill="#131921"/>
    <rect x="32" y="20" width="4" height="4" fill="#131921"/>
    <rect x="38" y="20" width="4" height="4" fill="#131921"/>
    <rect x="44" y="26" width="4" height="4" fill="#131921"/>
    <rect x="2"  y="20" width="4" height="4" fill="#131921"/>
    <rect x="8"  y="20" width="4" height="4" fill="#131921"/>
    <rect x="14" y="26" width="4" height="4" fill="#131921"/>
    <rect x="20" y="26" width="4" height="4" fill="#131921"/>
    <rect x="26" y="32" width="4" height="4" fill="#131921"/>
    <rect x="32" y="38" width="4" height="4" fill="#131921"/>
    <rect x="38" y="44" width="4" height="4" fill="#131921"/>
    <rect x="44" y="38" width="4" height="4" fill="#131921"/>
    <rect x="20" y="38" width="4" height="4" fill="#131921"/>
    <rect x="26" y="44" width="4" height="4" fill="#131921"/>
    <rect x="32" y="26" width="4" height="4" fill="#131921"/>
    <rect x="44" y="14" width="4" height="4" fill="#131921"/>
    <rect x="44" y="2"  width="4" height="4" fill="#131921"/>
    <rect x="8"  y="26" width="4" height="4" fill="#131921"/>
    <rect x="14" y="32" width="4" height="4" fill="#131921"/>
    <rect x="2"  y="26" width="4" height="4" fill="#131921"/>
  </svg>
);

const HealthCard = ({ grade = 'B', conditionSummary, completeness = 1.0, sellerName }) => {
  const config = GRADE_CONFIG[grade] || GRADE_CONFIG.B;
  const completenessPercent = Math.round(completeness * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md w-full max-w-sm overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-[#131921] px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#febd69] text-base flex-shrink-0 font-bold">R</span>
          <span className="text-white font-bold text-sm leading-tight whitespace-nowrap">Product Health Card</span>
        </div>
        <span className="flex-shrink-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
          AI Verified
        </span>
      </div>

      {/* Grade ring */}
      <div className="pt-5 pb-4 px-4 flex flex-col items-center bg-gray-50 border-b border-gray-100">
        <GradeRing grade={grade} config={config} />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Metrics */}
        <div className="space-y-3">
          <MetricBar
            label="Overall Condition"
            value={`${config.bar}/100`}
            percent={config.bar}
            color={config.barColor}
          />
          <MetricBar
            label="Completeness"
            value={`${completenessPercent}%`}
            percent={completenessPercent}
            color="#3b82f6"
          />
        </div>

        {/* Verification pills */}
        <div className="flex flex-wrap gap-1.5">
          <CheckPill text="AI Graded" />
          <CheckPill text="Hub Verified" />
          {sellerName ? <CheckPill text="Seller Rated" /> : <CheckPill text="Amazon Stock" />}
        </div>

        <hr className="border-gray-100" />

        {/* AI condition notes */}
        {conditionSummary ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
              AI Condition Notes
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">{conditionSummary}</p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
              AI Condition Notes
            </p>
            <p className="text-xs text-gray-500 italic">No notes provided.</p>
          </div>
        )}

        {sellerName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>Sold by <span className="font-semibold text-gray-800">{sellerName}</span></span>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* QR section */}
        <div className="flex items-center gap-3">
          <QRCode />
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 leading-tight">Scan to Verify</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">Cryptographically signed · GS1 Digital Link</p>
          </div>
        </div>

        {/* Eco badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <span className="text-green-600 text-xs font-bold uppercase">eco</span>
          <p className="text-[10px] text-green-700 leading-snug font-medium">
            Est. <strong>0.21 kg CO₂</strong> saved vs. buying new
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthCard;
