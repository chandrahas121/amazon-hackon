import React from "react";
import { useNavigate } from "react-router-dom";
import { StarIcon } from "lucide-react";
import { useCart } from "../context/CartContext";

const GRADE_STYLES = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  C: 'bg-orange-100 text-orange-800 border-orange-200',
  D: 'bg-red-100 text-red-800 border-red-200',
};

const SOURCE_LABEL = {
  p2p:       { text: 'REVIVE',    style: 'bg-[#232F3E] text-[#febd69]' },
  renewed:   { text: 'Renewed',   style: 'bg-blue-600 text-white' },
  warehouse: { text: 'Warehouse', style: 'bg-gray-600 text-white' },
  return:    { text: 'Returned',  style: 'bg-gray-400 text-white' },
};

const Product = ({ id, title, price, description, category, image, grade, source }) => {
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const inCart = cart.some((item) => item.id === id);
  const stars = grade === 'A' ? 5 : grade === 'B' ? 4 : grade === 'C' ? 3 : 2;
  const srcLabel = SOURCE_LABEL[source];

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart({ id, title, price, image, grade, source });
  };

  return (
    <div
      className="relative flex flex-col bg-white rounded shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-3 sm:p-4"
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Source badge */}
      {srcLabel && (
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 ${srcLabel.style}`}>
          {srcLabel.text}
        </span>
      )}

      {/* Grade badge */}
      {grade && (
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded border z-10 ${GRADE_STYLES[grade] || ''}`}>
          {grade}
        </span>
      )}

      {/* Image */}
      <div className="flex items-center justify-center mt-5 mb-2 h-36 sm:h-44">
        <img
          src={image}
          alt={title}
          className="max-h-full max-w-full object-contain"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
        />
      </div>

      {/* Title */}
      <h4 className="my-1.5 text-xs sm:text-sm font-semibold line-clamp-2 flex-grow">{title}</h4>

      {/* Stars */}
      <div className="flex my-1">
        {Array(stars).fill(null).map((_, i) => (
          <StarIcon key={`f${i}`} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
        ))}
        {Array(5 - stars).fill(null).map((_, i) => (
          <StarIcon key={`e${i}`} className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300 fill-gray-300" />
        ))}
      </div>

      {/* Description */}
      <p className="text-[11px] sm:text-xs text-gray-500 my-1 line-clamp-2">{description}</p>

      {/* Price */}
      <div className="mb-2 sm:mb-3 font-bold text-sm sm:text-base">
        ₹{parseFloat(price).toLocaleString('en-IN')}
      </div>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={inCart}
        className={`mt-auto py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors
          ${inCart
            ? 'bg-gray-200 text-gray-500 cursor-default'
            : 'bg-gradient-to-b from-yellow-200 to-yellow-400 border border-yellow-300 hover:from-yellow-300 hover:to-yellow-500'
          }`}
      >
        {inCart ? 'Added' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default Product;
