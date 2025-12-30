const ButtonNavigation = ({ active, onClick, icon, label, badge }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 flex-1 ${active ? 'text-blue-500 -translate-y-1' : 'text-slate-500'} hover:text-blue-500 hover:-translate-y-1`}
  >
    <div className="relative">
      <div className="text-2xl">
        <i className={icon}></i>
      </div>
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-lg px-1.5 py-0.5 text-xs font-bold">
          {badge}
        </div>
      )}
    </div>
    <div className="text-xs">{label}</div>
  </div>
);

export default ButtonNavigation;