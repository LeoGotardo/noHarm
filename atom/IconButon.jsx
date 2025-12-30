const IconButton = ({ icon, onClick, variant = "primary" }) => {
  const variants = {
    primary: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30"
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg border-0 cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 ${variants[variant]}`}
    >
      <i className={icon}></i>
    </button>
  );
};

export default IconButton;