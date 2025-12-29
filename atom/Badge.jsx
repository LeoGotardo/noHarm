const Badge = ({ children, variant = "primary" }) => {
  const variants = {
    primary: "bg-blue-500",
    danger: "bg-red-600",
    success: "bg-green-500"
  };
  
  return (
    <span className={`${variants[variant]} text-white rounded-xl px-2 py-0.5 text-xs font-bold`}>
      {children}
    </span>
  );
};

export default Badge;