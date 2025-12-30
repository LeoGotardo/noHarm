const ActionCard = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-slate-700 p-5 rounded-2xl mb-4 border border-slate-600 cursor-pointer transition-all duration-300 hover:bg-slate-600 hover:translate-x-1"
  >
    <div className="flex items-center gap-4 mb-2">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/20">
        <i className={`${icon} text-blue-400 text-3xl`}></i>
      </div>
      <div className="text-base font-semibold text-slate-100">{title}</div>
    </div>
    <div className="text-sm text-slate-400 ml-16">{description}</div>
  </div>
);

export default ActionCard;