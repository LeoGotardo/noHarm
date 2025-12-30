const StatCard = ({ icon, label, value }) => (
  <Card className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
    <div className="text-4xl mb-2">
      <i className={`bi ${icon} text-blue-400`}></i>
    </div>
    <div className="text-xs text-slate-400 mb-1">{label}</div>
    <div className="text-2xl font-bold text-blue-400">{value}</div>
  </Card>
);

export default StatCard;