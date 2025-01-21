const Home = () => (
    <section id="home" className="h-screen flex items-center justify-center bg-gray-200">
      <h1 className="text-4xl font-bold text-gray-800">Bem-vindo ao Meu Projeto!</h1>
      {/* Botão para navegar até o caixa */}
      <a href="caixa" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Ir para o caixa</a>
    </section>
  );
  
  export default Home;
  