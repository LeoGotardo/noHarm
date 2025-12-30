const ProgressScreen = ({ cleanDays }) => {
  const milestones = [
    { name: '1 Ano Limpo', date: 'Não alcançado', achieved: false, icon: 'bi bi-lock-fill' },
    { name: '6 Meses Limpo', date: 'Não alcançado', achieved: false, icon: 'bi bi-lock-fill' },
    { name: '3 Meses Limpo', date: 'Alcançado em 15/10/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Mês Limpo', date: 'Alcançado em 15/08/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Semana Limpa', date: 'Alcançado em 22/07/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Dia Limpo', date: 'Alcançado em 16/07/2024', achieved: true, icon: 'bi bi-check2' }
  ];
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-blue-400">Seu Progresso</h1>
      </div>
      
      <Card className="mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-slate-100">Tempo Limpo Total</div>
          <div className="text-4xl font-bold text-blue-400">{cleanDays} dias</div>
        </div>
        <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center text-slate-500">
          <i className="bi bi-graph-up text-5xl"></i>
        </div>
      </Card>
      
      <StatsGrid>
        <StatCard icon="bi-trophy-fill" label="Melhor Sequência" value={`${cleanDays}d`} />
        <StatCard icon="bi-calendar-check" label="Tempo Médio" value="98d" />
      </StatsGrid>
      
      <Card>
        <h3 className="text-base font-semibold text-slate-100 mb-4">
          <i className="bi bi-award-fill"></i> Marcos Alcançados
        </h3>
        <div className="flex flex-col gap-2">
          {milestones.map((milestone, idx) => (
            <MilestoneItem
              key={idx}
              icon={milestone.icon}
              name={milestone.name}
              date={milestone.date}
              achieved={milestone.achieved}
            />
          ))}
        </div>
      </Card>
      
      <div className="h-24"></div>
    </div>
  );
};

export default ProgressScreen;