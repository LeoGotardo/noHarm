const ProgressBar = ({ value, max, label }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="my-5">
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;