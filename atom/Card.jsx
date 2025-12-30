const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-700 rounded-2xl p-5 border border-slate-600 ${className}`}>
    {children}
  </div>
);

export default Card;