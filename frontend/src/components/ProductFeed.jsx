import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Product from "./Product";

const SOURCE_TABS = [
  { label: 'All',       value: '' },
  { label: 'Revive',    value: 'p2p' },
  { label: 'Renewed',   value: 'renewed' },
  { label: 'Warehouse', value: 'warehouse' },
  { label: 'Returns',   value: 'return' },
];

const ProductFeed = ({ products, loading }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSource = searchParams.get('source') || '';

  const handleTabClick = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('source', value);
    else params.delete('source');
    navigate(`/?${params.toString()}`);
  };

  return (
    <div>
      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 overflow-x-auto scrollbar-none">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabClick(tab.value)}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border transition-colors flex-shrink-0
              ${activeSource === tab.value
                ? 'bg-[#232F3E] text-[#febd69] border-[#232F3E]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#232F3E]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
          {Array(8).fill(null).map((_, i) => (
            <div key={i} className="bg-white rounded shadow-sm p-3 animate-pulse">
              <div className="h-32 sm:h-40 bg-gray-200 rounded mb-3" />
              <div className="h-3 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
              <div className="h-7 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-gray-500 text-sm mb-3">No listings found.</p>
          <button
            onClick={() => navigate('/sell')}
            className="text-[#007185] hover:underline text-sm font-medium"
          >
            Be the first to list an item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
          {products.map((p) => (
            <Product
              key={p.id}
              id={p.id}
              title={p.title}
              price={p.price}
              description={p.description}
              category={p.category}
              image={p.image}
              grade={p.grade}
              source={p.source}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductFeed;
