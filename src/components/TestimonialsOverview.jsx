import React from "react";
import "../Styles/StylesTestimonials.css";

const Star = () => (
  <svg className="t-star" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const renderStars = (rating) =>
  Array.from({ length: rating }).map((_, i) => <Star key={i} />);

const Testimonials = () => {
  const testimonials = [
    {
      name: "Tha Hav",
      location: "Google Maps",
      rating: 5,
      text: "أخذت جلابية كاملة لعرس أخي وكانت رائعة جدًا. شكرًا لصاحب المحل، خياطته ممتازة وأنصح به بشدة.",
    },
    {
      name: "nsiri khaled",
      location: "Google Maps",
      rating: 5,
      text: "وهرة زمان يقدم أفضل الجباب التونسية والملابس التقليدية المصنوعة يدويًا. جودة ممتازة جدًا… شكرًا سابري بسعاد.",
    },
    {
      name: "عمر التازي",
      location: "Google Maps",
      rating: 5,
      text: "لبست الجبة في مناسبة خاصة وتلقيت الكثير من الإطراءات. عمل سابري يحافظ على التقاليد ويضيف لمسة عصرية أنيقة.",
    },
  ];

  return (
    <section className="testimonials" dir="rtl">
      <div className="testimonials__container">
        <div className="testimonials__header">
          <h2 className="testimonials__title">ماذا يقول حرفاؤنا</h2>
          <p className="testimonials__subtitle">
            اكتشف لماذا يختار حرفاؤنا وهرة زمان في أجمل مناسباتهم الخاصة.
          </p>
        </div>

        <div className="testimonials__grid">
          {testimonials.map((t, index) => (
            <div className="t-card" key={index}>
              <div className="t-card__content">
                <div className="t-stars">{renderStars(t.rating)}</div>

                <p className="t-text">"{t.text}"</p>

                <div className="t-author">
                  <h4 className="t-name">{t.name}</h4>
                  <p className="t-location">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
