import { ClipLoader } from "react-spinners";
import { useTranslation } from "react-i18next";

const LoadingSpinner = () => {
  const { t, i18n } = useTranslation();
  if (!i18n.isInitialized) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white animate-fadeIn">
      {/* 🌐 Translated Branding Text */}
      <h2 className="text-[#C49A6C] text-xl font-semibold mb-4 font-cairo tracking-wide">
        {t("loading.brand_loading")}
      </h2>
      <ClipLoader color="#C49A6C" size={55} speedMultiplier={1.2} />
    </div>
  );
};

export default LoadingSpinner;
