const Button = ({ children, variant = "primary", onClick, disabled, className = "" }) => {
  const variants = {
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-blue-500/40",
    danger: "bg-gradient-to-br from-red-600 to-red-700 hover:shadow-red-600/40",
    success: "bg-gradient-to-br from-green-500 to-green-600 hover:shadow-green-500/40",
    secondary: "bg-slate-700 hover:shadow-slate-700/40"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-4 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;