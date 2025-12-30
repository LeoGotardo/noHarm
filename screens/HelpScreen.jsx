const EmergencyScreen = () => (
  <div>
    <div className="text-center mb-8">
      <h1 className="text-3xl text-blue-400 mb-2">Recursos de Emergência</h1>
      <p className="text-slate-400 text-sm">Você não está sozinho. Estamos aqui para ajudar.</p>
    </div>
    
    <EmergencyCard
      icon="bi bi-telephone-fill"
      title="CVV - Centro de Valorização da Vida"
      subtitle="Prevenção do suicídio - 24h gratuito"
      buttonText="Ligar 188"
      buttonVariant="danger"
      buttonIcon="bi bi-telephone-fill"
      onClick={() => window.location.href = 'tel:188'}
    />
    
    <EmergencyCard
      icon="bi bi-hospital"
      title="CAPS - Centro de Atenção Psicossocial"
      subtitle="Atendimento especializado em saúde mental"
      buttonText="Encontrar CAPS Próximo"
      buttonVariant="primary"
      buttonIcon="bi bi-geo-alt-fill"
      onClick={() => alert('Buscando CAPS próximos...')}
    />
    
    <EmergencyCard
      icon="bi bi-heart-pulse"
      title="Técnicas de Emergência"
      subtitle="Exercícios para momentos difíceis"
      buttonText="Ver Técnicas"
      buttonVariant="success"
      buttonIcon="bi bi-play-circle-fill"
      onClick={() => alert('Carregando técnicas...')}
    />
    
    <EmergencyCard
      icon="bi bi-heart-fill"
      title="SAMU"
      subtitle="Emergências médicas"
      buttonText="Ligar 192"
      buttonVariant="danger"
      buttonIcon="bi bi-telephone-fill"
      onClick={() => window.location.href = 'tel:192'}
    />
  </div>
);

export default EmergencyScreen;