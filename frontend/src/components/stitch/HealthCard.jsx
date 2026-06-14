import React, { useState } from 'react';

const GRADE_CONFIG = {
  A: { label: 'Like New',   sublabel: 'Mint — no visible defects', color: '#15803d', bg: '#f0fdf4', accent: '#16a34a', score: 95, pill: '#bbf7d0' },
  B: { label: 'Very Good',  sublabel: 'Light cosmetic wear',      color: '#b45309', bg: '#fffbeb', accent: '#d97706', score: 75, pill: '#fde68a' },
  C: { label: 'Good',       sublabel: 'Visible wear, functional', color: '#c2410c', bg: '#fff7ed', accent: '#ea580c', score: 55, pill: '#fed7aa' },
  D: { label: 'Acceptable', sublabel: 'Heavy wear or defects',    color: '#b91c1c', bg: '#fef2f2', accent: '#dc2626', score: 35, pill: '#fecaca' },
};

const SEVERITY_COLOR = {
  minor:    { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04' },
  moderate: { bg: '#ffedd5', text: '#9a3412', dot: '#ea580c' },
  major:    { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  severe:   { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
};

const INSPECTION_LABEL = {
  ai_only:  'AI Vision',
  ai_agent: 'AI + Doorstep Agent',
  ai_spn:   'AI + SPN Professional',
};

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3 Premium' };
const TIER_COLOR = { 1: '#15803d', 2: '#1d4ed8', 3: '#7c3aed' };
const TIER_BG    = { 1: '#dcfce7', 2: '#dbeafe', 3: '#ede9fe' };

// Static QR graphic (GS1-style placeholder)
const QRCode = ({ qrData }) => (
  <div title={qrData || 'Health Card QR'}>
    <svg width="36" height="36" viewBox="0 0 52 52">
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
  </div>
);

const Check = ({ color = '#16a34a' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <circle cx="7" cy="7" r="7" fill={color}/>
    <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Shield = ({ valid }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"
      fill={valid ? '#16a34a' : '#dc2626'} opacity="0.15"
      stroke={valid ? '#16a34a' : '#dc2626'} strokeWidth="1.5"/>
    {valid && <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {!valid && <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>}
  </svg>
);

// Fallback static checklist when no real cardData
const STATIC_CHECKLIST = [
  'Display & Screen', 'Battery Health', 'Buttons & Ports',
  'Camera & Audio', 'Wireless Connectivity', 'Software & Firmware',
  'Accessories', 'Factory Reset',
];

const HealthCard = ({
  grade = 'B',
  conditionSummary,
  completeness = 1.0,
  sellerName,
  cardData = null,   // full API response from GET /api/card/<id>/
  loading = false,
}) => {
  const [showLedger, setShowLedger] = useState(false);

  // Merge API data with prop fallbacks
  const g = cardData?.grade || grade;
  const cfg = GRADE_CONFIG[g] || GRADE_CONFIG.B;
  const summary = cardData?.condition_summary || conditionSummary || '';
  const completePct = Math.round((cardData?.completeness ?? completeness) * 100);

  // Derived display values
  const tier = cardData?.tier || 1;
  const defects = cardData?.defects || [];
  const inspectedBy = INSPECTION_LABEL[cardData?.inspected_by] || 'AI Vision';
  const guaranteeDays = cardData?.guarantee_days ?? 7;
  const guaranteeHolder = cardData?.guarantee_holder || 'seller_escrow';
  const prevOwners = cardData?.previous_owners ?? 0;
  const chainValid = cardData?.chain_valid ?? true;
  const cardHash = cardData?.card_hash || '';
  const ledgerEntries = cardData?.ledger || [];
  const passedCount = g === 'D' ? 6 : g === 'C' ? 7 : 8;

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
          <QRCode qrData={cardData?.qr_data} />
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="bg-white px-4 py-6 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[#febd69] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading health card…</span>
        </div>
      )}

      {/* ── Grade banner ── */}
      {!loading && (
        <div className="px-4 py-4 flex items-center gap-3" style={{ background: cfg.bg }}>
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: cfg.accent }}
          >
            <span className="text-white font-black text-3xl leading-none">{g}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <p className="text-base font-bold leading-tight" style={{ color: cfg.color }}>{cfg.label}</p>
              <span className="text-xs font-bold tabular-nums" style={{ color: cfg.accent }}>
                {cardData ? Math.round(cardData.confidence * 100) : cfg.score}
                {cardData ? '% conf' : '/100'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{cfg.sublabel}</p>
            <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cfg.score}%`, background: cfg.accent }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm" style={{ background: cfg.pill, color: cfg.color }}>
                AI Condition Grade
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm" style={{ background: cfg.pill, color: cfg.color }}>
                Completeness {completePct}%
              </span>
              {cardData && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
                  style={{ background: TIER_BG[tier], color: TIER_COLOR[tier] }}
                >
                  {TIER_LABEL[tier]}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Inspection metadata (when real card) ── */}
      {!loading && cardData && (
        <div className="bg-white border-t border-[#EAEDED] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check color={cfg.accent} />
            <span className="text-[10px] text-[#0F1111] font-semibold">{inspectedBy}</span>
          </div>
          <div className="flex items-center gap-3">
            {prevOwners > 0 && (
              <span className="text-[10px] text-gray-500">{prevOwners} prev owner{prevOwners > 1 ? 's' : ''}</span>
            )}
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              {guaranteeDays}d guarantee
            </span>
          </div>
        </div>
      )}

      {/* ── Defects / Checklist ── */}
      {!loading && (
        <div className="bg-white">
          <div className="px-4 py-2.5 flex items-center justify-between border-t border-b border-[#EAEDED]" style={{ background: '#F7F8F8' }}>
            <span className="text-[10px] font-bold text-[#0F1111] uppercase tracking-widest">
              {cardData ? 'Defects Found' : 'Inspection Report'}
            </span>
            <span className="text-[10px] font-bold" style={{ color: cfg.accent }}>
              {cardData
                ? `${defects.length} issue${defects.length !== 1 ? 's' : ''}`
                : `${passedCount}/${STATIC_CHECKLIST.length} Passed`}
            </span>
          </div>

          {cardData ? (
            defects.length === 0 ? (
              <div className="px-4 py-3 flex items-center gap-2">
                <Check color="#16a34a" />
                <span className="text-xs text-green-700 font-medium">No defects detected</span>
              </div>
            ) : (
              <div className="divide-y divide-[#EAEDED]">
                {defects.slice(0, 6).map((d, i) => {
                  const sev = SEVERITY_COLOR[d.severity] || SEVERITY_COLOR.minor;
                  return (
                    <div key={i} className="flex items-center gap-2.5 px-4 py-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sev.dot }} />
                      <span className="text-xs text-[#0F1111] flex-1 capitalize">{d.type}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm capitalize"
                        style={{ background: sev.bg, color: sev.text }}
                      >
                        {d.severity}
                      </span>
                    </div>
                  );
                })}
                {defects.length > 6 && (
                  <div className="px-4 py-2 text-[10px] text-gray-400">+{defects.length - 6} more</div>
                )}
              </div>
            )
          ) : (
            <div className="divide-y divide-[#EAEDED]">
              {STATIC_CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2.5 px-4 py-2">
                  <Check />
                  <span className="text-xs text-[#0F1111]">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Condition notes ── */}
      {!loading && (
        <div className="px-4 py-3 border-t border-[#EAEDED]" style={{ background: '#F7F8F8' }}>
          <p className="text-[10px] font-bold text-[#0F1111] uppercase tracking-widest mb-1">Condition Notes</p>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {summary || <span className="italic text-gray-400">No notes provided.</span>}
          </p>
          {sellerName && !cardData && (
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
      )}

      {/* ── Integrity section (when real card) ── */}
      {!loading && cardData && (
        <div className="border-t border-[#EAEDED] bg-white px-4 py-3">
          <p className="text-[10px] font-bold text-[#0F1111] uppercase tracking-widest mb-2">Tamper Evidence</p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield valid={chainValid} />
              <span className="text-[11px] font-semibold" style={{ color: chainValid ? '#15803d' : '#b91c1c' }}>
                {chainValid ? 'Hash chain verified' : 'Chain integrity warning'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {cardHash.slice(0, 10)}…
            </span>
          </div>
          {ledgerEntries.length > 0 && (
            <button
              onClick={() => setShowLedger(!showLedger)}
              className="text-[10px] text-[#007185] hover:underline"
            >
              {showLedger ? 'Hide' : 'Show'} provenance log ({ledgerEntries.length} event{ledgerEntries.length > 1 ? 's' : ''})
            </button>
          )}
          {showLedger && (
            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
              {ledgerEntries.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#febd69] flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-[#0F1111] capitalize">{e.event_label || e.event}</span>
                    <span className="text-gray-400 ml-1.5">{e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default HealthCard;
