const CounterCard = ({ days, onReset, onSupport }) => {
  const monthsAndDays = Math.floor(days / 30);
  const remainingDays = days % 30;
  const progressToSixMonths = (days / 180) * 100;
  const daysToSixMonths = 180 - days;
  
  return (
    <Card className="bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl">
      <div className="text-center text-5xl mb-5 animate-pulse">
        <i className="bi bi-star-fill text-yellow-400"></i>
      </div>
      <div className="text-center text-6xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
        {days}
      </div>
      <div className="text-center text-2xl text-slate-400 mb-5">dias limpos</div>
      <div className="text-center text-base text-green-500 font-semibold mb-5 p-2 bg-green-500/10 rounded-lg">
        <i className="bi bi-trophy-fill"></i> Parabéns! {monthsAndDays} meses{remainingDays > 0 && ` e ${remainingDays} dias`}!
      </div>
      
      <div className="my-5">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Próximo marco: 6 meses</span>
          <span>{daysToSixMonths} dias</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${Math.min(progressToSixMonths, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-5">
        <Button variant="danger" onClick={onReset}>
          <i className="bi bi-arrow-clockwise"></i> Reset
        </Button>
        <Button variant="primary" onClick={onSupport}>
          <i className="bi bi-heart-fill"></i> Apoio
        </Button>
      </div>
    </Card>
  );
};

export default CounterCard;