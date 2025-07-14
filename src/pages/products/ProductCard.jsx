import React, { useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { getImgUrl } from "../../utils/getImgUrl";
import { addToCart } from "../../redux/features/cart/cartSlice";




const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  if (!i18n.isInitialized) return null;
  const [quantity, setQuantity] = useState(1);

 

  if (!product) return null;

  const title =
    product?.translations?.[lang]?.title ||
    product?.title ||
    "";

  const description =
    product?.translations?.[lang]?.description ||
    product?.description ||
    "";

  const displayedColor =
    product?.colors?.[0]?.colorName?.[lang] ||
    product?.colors?.[0]?.colorName?.en ||
    t("default");

  const displayedStock =
    product?.colors?.[0]?.stock ?? product?.stockQuantity ?? 0;

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);
    setQuantity(value > displayedStock ? displayedStock : value);
  };

  const handleAddToCart = () => {
    const defaultColor = product?.colors?.[0] || {
      colorName: {
        en: "Original",
        fr: "Original",
        ar: "أصلي",
      },
      image: product?.coverImage,
      stock: product?.stockQuantity,
    };

    if ((defaultColor?.stock ?? 0) > 0 && quantity > 0) {
      dispatch(
        addToCart({
          ...product,
          quantity,
          color: defaultColor,
        })
      );
    }
  };

  



  return (
   <div className="product-card group relative bg-white border border-gray-200 overflow-hidden transition-all duration-300 max-w-[250px] w-full mx-auto">
  <div className="relative w-full aspect-[3/4] overflow-hidden bg-white">
    <Link to={`/products/${product._id}`} className="block w-full h-full">
      <img
        src={getImgUrl(product?.coverImage)}
        alt={title}
        className="w-full h-full object-contain transition duration-300"
      />
    </Link>
  </div>

  <div className="p-3 text-center">
    <Link to={`/products/${product._id}`}>
      <h3 className="text-base font-semibold text-gray-900 hover:text-[#8B5C3E]">
        {title}
      </h3>
    </Link>

    <p className="text-sm text-gray-500 mt-1">
      {description.length > 60 ? `${description.slice(0, 60)}...` : description}
    </p>

    <div className="text-sm font-bold text-gray-900 mt-1">
      {product?.newPrice} DT
      {product?.oldPrice && (
        <span className="text-gray-400 text-xs line-through ml-2">
          {Math.round(product?.oldPrice)} DT
        </span>
      )}
    </div>
  </div>
</div>

  );
  
 
};

export default ProductCard;


<div className="text-lg font-semibold text-[#8B5C3E]"></div>