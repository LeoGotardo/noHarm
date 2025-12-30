const MilestoneItem = ({ icon, name, date, achieved }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
      achieved ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-500'
    }`}>
      <i className={icon}></i>
    </div>
    <div className="flex-1">
      <div className="text-sm font-semibold text-slate-100">{name}</div>
      <div className="text-xs text-slate-500">{date}</div>
    </div>
  </div>
);

export default MilestoneItem;