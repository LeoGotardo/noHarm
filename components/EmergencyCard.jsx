const EmergencyCard = ({ icon, title, subtitle, buttonText, buttonVariant, buttonIcon, onClick }) => (
  <Card className="bg-gradient-to-br from-slate-700 to-slate-800 mb-5 border-2">
    <div className="flex items-center gap-4 mb-5">
      <div className={`w-15 h-15 rounded-2xl flex items-center justify-center text-3xl ${
        buttonVariant === 'danger' ? 'bg-red-600/20 text-red-400' :
        buttonVariant === 'primary' ? 'bg-blue-500/20 text-blue-400' :
        'bg-green-500/20 text-green-500'
      }`}>
        <i className={icon}></i>
      </div>
      <div>
        <div className="text-lg font-semibold text-slate-100 mb-1">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
    <Button variant={buttonVariant} onClick={onClick} className="w-full">
      <i className={buttonIcon}></i> {buttonText}
    </Button>
  </Card>
);

export default EmergencyCard;