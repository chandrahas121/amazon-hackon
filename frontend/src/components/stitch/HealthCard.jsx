import React from 'react';

const GRADE_CONFIG = {
  A: { label: 'Excellent',  sublabel: 'Like new condition',       color: '#15803d', bg: '#f0fdf4', accent: '#16a34a', score: 95, pill: '#bbf7d0' },
  B: { label: 'Very Good',  sublabel: 'Light cosmetic wear',      color: '#b45309', bg: '#fffbeb', accent: '#d97706', score: 75, pill: '#fde68a' },
  C: { label: 'Good',       sublabel: 'Visible wear, functional', color: '#c2410c', bg: '#fff7ed', accent: '#ea580c', score: 55, pill: '#fed7aa' },
  D: { label: 'Acceptable', sublabel: 'Heavy wear or defects',    color: '#b91c1c', bg: '#fef2f2', accent: '#dc2626', score: 35, pill: '#fecaca' },
};

const CHECKLIST = [
  'Display & Screen',
  'Battery Health',
  'Buttons & Ports',
  'Camera & Audio',
  'Wireless Connectivity',
  'Software & Firmware',
  'Accessories',
  'Factory Reset',
];

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <circle cx="7" cy="7" r="7" fill="#16a34a"/>
    <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const QRCode = () => (
  <svg width="36" height="36" viewBox="0 0 52 52" className="flex-shrink-0">
    <rect width="52" height="52" fill="white"/>
    <rect x="2"  y="2"  width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="4"  y="4"  width="11" height="11" rx="0.5" fill="white"/>
    <rect x="6"  y="6"  width="7"  height="7"  fill="#131921"/>
    <rect x="35" y="2"  width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="37" y="4"  width="11" height="11" rx="0.5" fill="white"/>
    <rect x="39" y="6"  width="7"  height="7"  fill="#131921"/>
    <rect x="2"  y="35" width="15" height="15" rx="1.5" fill="#131921"/>
    <rect x="4"  y="37" width="11" height="11" rx="0.5" fill="white"/>
    <rect x="6"  y="39" width="7"  height="7"  fill="#131921"/>
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
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.B;
  const completePct = Math.round(completeness * 100);
  const passedCount = grade === 'D' ? 6 : grade === 'C' ? 7 : 8;

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-xl font-sans" style={{ maxWidth: 360 }}>

      {/* ── Header ── */}
      <div className="bg-[#131921] px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
          <span className="text-[#febd69] font-black text-sm tracking-tight">amazon</span>
          <span className="text-white/50 text-[9px] font-bold tracking-[2px] uppercase">revive</span>
        </div>
        <span className="text-[9px] font-bold text-[#131921] bg-[#febd69] px-2.5 py-0.5 rounded-sm tracking-wider uppercase whitespace-nowrap">
          Health Card
        </span>
        <div className="ml-2 rounded overflow-hidden flex-shrink-0">
          <QRCode />
        </div>
      </div>

      {/* ── Grade banner ── */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ background: cfg.bg }}>
        {/* Grade badge */}
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: cfg.accent }}
        >
          <span className="text-white font-black text-3xl leading-none">{grade}</span>
        </div>

        {/* Grade info + score bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <p className="text-base font-bold leading-tight" style={{ color: cfg.color }}>{cfg.label}</p>
            <span className="text-xs font-bold tabular-nums" style={{ color: cfg.accent }}>{cfg.score}/100</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">{cfg.sublabel}</p>
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${cfg.score}%`, background: cfg.accent }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
              style={{ background: cfg.pill, color: cfg.color }}
            >
              AI Condition Grade
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
              style={{ background: cfg.pill, color: cfg.color }}
            >
              Completeness {completePct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Inspection checklist ── */}
      <div className="bg-white">
        <div className="px-4 py-2.5 flex items-center justify-between border-t border-b border-[#EAEDED]" style={{ background: '#F7F8F8' }}>
          <span className="text-[10px] font-bold text-[#0F1111] uppercase tracking-widest">
            Inspection Report
          </span>
          <span className="text-[10px] font-bold" style={{ color: cfg.accent }}>
            {passedCount}/{CHECKLIST.length} Passed
          </span>
        </div>
        <div className="divide-y divide-[#EAEDED]">
          {CHECKLIST.map((item) => (
            <div key={item} className="flex items-center gap-2.5 px-4 py-2">
              <Check />
              <span className="text-xs text-[#0F1111]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Condition notes ── */}
      <div className="px-4 py-3 border-t border-[#EAEDED]" style={{ background: '#F7F8F8' }}>
        <p className="text-[10px] font-bold text-[#0F1111] uppercase tracking-widest mb-1">Condition Notes</p>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {conditionSummary || <span className="italic text-gray-400">No notes provided.</span>}
        </p>
        {sellerName && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Sold by <span className="font-semibold text-[#007185]">{sellerName}</span>
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
          </svg>
          <span className="text-[11px] text-green-700 font-medium">
            Est. <strong>0.21 kg CO₂</strong> saved vs. buying new
          </span>
        </div>
      </div>

    </div>
  );
};

export default HealthCard;
