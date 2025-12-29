const Avatar = ({ children, gradient = "linear-gradient(135deg, #3b82f6, #2563eb)", size = 60 }) => (
  <div 
    className="rounded-full flex items-center justify-center text-white relative"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      background: gradient,
      fontSize: `${size * 0.4}px`
    }}
  >
    {children}
  </div>
);

export default Avatar;