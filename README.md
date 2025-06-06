# BotFoods Desktop

Aplicação desktop para gestão de restaurantes e delivery construída com React, Electron e Vite. Esta aplicação fornece um sistema completo de ponto de venda (PDV) com gestão de delivery, controle de caixa e processamento de pedidos.

## 🚀 Funcionalidades

- **Ponto de Venda (PDV)**: Sistema PDV completo para pedidos no balcão e delivery
- **Gestão de Caixa**: Abertura/fechamento de caixa com rastreamento de transações
- **Gestão de Delivery**: Interface dedicada para pedidos de delivery
- **Gestão de Mesas**: Sistema de pedidos baseado em mesas
- **Processamento de Pagamentos**: Integração com Stripe para pagamentos com cartão
- **Atualizações em Tempo Real**: Updates ao vivo do status dos pedidos
- **Multi-plataforma**: Funciona no Windows, macOS e Linux
- **Versão Web**: Pode ser executado como aplicação web ou desktop

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 com hooks modernos
- **Framework Desktop**: Electron 35
- **Ferramenta de Build**: Vite 6 com HMR (Hot Module Replacement)
- **Estilização**: Tailwind CSS 3 para design responsivo
- **Ícones**: Biblioteca React Icons
- **Roteamento**: React Router DOM 7
- **Pagamentos**: Integração React Stripe
- **Desenvolvimento**: ESLint para qualidade de código

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn como gerenciador de pacotes
- Servidor da API BotFoods rodando (veja ../api/README.md)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd botfood/desktop
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo de ambiente:
```bash
cp .env.example .env
```

4. Configure as variáveis de ambiente no `.env`:
```env
# Configuração da API
VITE_API_URL=http://localhost:8080

# Configuração Stripe (para pagamentos)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Configurações da Aplicação
VITE_APP_NAME=BotFoods
VITE_APP_VERSION=1.0.0
```

## 🏃‍♂️ Executando a Aplicação

### Modo Desenvolvimento (Web + Electron)
```bash
npm run dev
```
Isso inicia tanto o servidor dev do Vite quanto o app Electron com hot reload.

### Desenvolvimento Web Apenas
```bash
npm run web
```
Executa apenas a versão web em `http://localhost:5173`

### Build de Produção
```bash
npm run build
```

### Build Electron para Produção
```bash
npm run electron:build
```
Cria pacotes distribuíveis para sua plataforma.

### Iniciar App Electron Buildado
```bash
npm start
```

## 🖥️ Estrutura da Aplicação

```
src/
├── components/          # Componentes UI reutilizáveis
│   ├── FinalizarButton.jsx    # Botão de finalização de pedido
│   ├── PdvActions.jsx         # Botões de ação do PDV
│   ├── RequireCaixa.jsx       # Wrapper de validação de caixa
│   └── FecharCaixaButton.jsx  # Modal de fechamento de caixa
├── pages/              # Páginas principais da aplicação
│   ├── Delivery.jsx           # Interface de gestão de delivery
│   ├── PdvMesa.jsx           # Interface PDV baseada em mesas
│   ├── Caixa.jsx             # Gestão de caixa
│   └── Login.jsx             # Página de autenticação
├── hooks/              # Hooks React customizados
├── utils/              # Funções utilitárias
├── styles/             # Arquivos CSS e de estilização
└── App.jsx             # Componente principal da aplicação
```

## 🎯 Funcionalidades Principais

### Ponto de Venda (PDV)
- **Gestão de Mesas**: Gerenciar pedidos para mesas específicas
- **Seleção de Produtos**: Navegar e adicionar produtos aos pedidos
- **Modificação de Pedidos**: Editar quantidades, remover itens, aplicar descontos
- **Processamento de Pagamentos**: Opções de pagamento em dinheiro e cartão
- **Geração de Recibos**: Imprimir ou exibir recibos de pedidos

### Gestão de Delivery
- **Fila de Pedidos**: Visualizar e gerenciar pedidos de delivery
- **Informações do Cliente**: Armazenar endereços de entrega e informações de contato
- **Rastreamento de Status**: Atualizar status do pedido durante todo o processo de entrega
- **Otimização de Rotas**: Planejar rotas de entrega eficientes

### Caixa
- **Operações Diárias**: Abrir/fechar sessões de caixa
- **Rastreamento de Transações**: Monitorar todas as transações em dinheiro e cartão
- **Relatórios**: Gerar relatórios de vendas diárias
- **Validação de Saldo**: Garantir precisão do caixa

## 🔧 Configuração

### Configuração do Electron
O app Electron está configurado em `electron/main.cjs`:
- Tamanho e comportamento da janela
- Customização do menu
- Configurações de segurança
- Comportamento desenvolvimento vs produção

### Configuração de Build
Configurações de build estão em `electron-builder.json`:
- Metadados e ícones do app
- Builds específicos por plataforma
- Pacotes de instalação
- Configuração de auto-atualização

### Configuração do Vite
`vite.config.js` gerencia:
- Configuração do plugin React
- Configurações do servidor de desenvolvimento
- Otimização de build
- Integração com Electron

## 🎨 Estilização

A aplicação usa **Tailwind CSS** para estilização:
- Princípios de design responsivo
- Esquema de cores e espaçamento consistentes
- Componentes UI modernos
- Suporte a modo escuro/claro (configurável)

Principais características de design:
- Interface limpa e profissional
- Navegação intuitiva
- Design responsivo mobile-first
- Considerações de acessibilidade

## 🔐 Autenticação

O app inclui autenticação de usuários:
- Autenticação baseada em token JWT
- Renovação automática de token
- Controle de acesso baseado em função
- Gerenciamento seguro de sessão

## 💳 Integração de Pagamentos

Integração com Stripe para processamento de pagamentos:
- Pagamentos com cartão de crédito/débito
- Formulários de pagamento seguros
- Histórico de transações
- Geração de recibos

## 🛡️ Proteção de Rotas

Rotas protegidas garantem controle de acesso adequado:
- **Validação de Caixa**: Impede acesso sem caixa aberto
- **Guards de Autenticação**: Redireciona usuários não autenticados
- **Acesso Baseado em Função**: Diferentes permissões para diferentes tipos de usuário

## 🧪 Testes

```bash
# Executar linter
npm run lint

# Build para teste
npm run build

# Testar build Electron
npm run electron:build
```

## 📦 Build para Distribuição

### Windows
```bash
npm run electron:build -- --win
```

### macOS
```bash
npm run electron:build -- --mac
```

### Linux
```bash
npm run electron:build -- --linux
```

### Todas as Plataformas
```bash
npm run electron:build -- --win --mac --linux
```

## 🚀 Deploy

### Deploy Web
Faça o build da versão web e faça deploy no seu provedor de hospedagem:
```bash
npm run build
# Faça deploy da pasta 'dist' para seu servidor web
```

### Distribuição Desktop
Use os pacotes buildados de `npm run electron:build`:
- Windows: instalador `.exe`
- macOS: imagem de disco `.dmg`
- Linux: pacote `.AppImage` ou `.deb`

### Google Cloud Platform
Para deploy web no GCP:
```bash
npm run build:gcp
```

## 🔧 Dicas de Desenvolvimento

### Hot Reload
Durante o desenvolvimento, tanto React quanto Electron suportam hot reload:
- Componentes React atualizam instantaneamente
- Processo principal do Electron requer reinicialização para mudanças

### Debugging
- **React DevTools**: Disponível no modo desenvolvimento
- **Electron DevTools**: Acesse via View → Toggle Developer Tools
- **Console Logging**: Use `console.log()` para debugging

### Gerenciamento de Estado
O app usa gerenciamento de estado nativo do React:
- `useState` para estado de componente
- `useEffect` para efeitos colaterais
- Context API para estado global (se necessário)
- Props drilling para comunicação entre componentes

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-feature`
3. Siga os padrões de código (configuração ESLint)
4. Teste suas mudanças completamente
5. Commit com mensagens descritivas
6. Push para sua branch: `git push origin feature/nova-feature`
7. Envie um Pull Request

### Padrões de Código
- Use a configuração ESLint fornecida
- Siga as melhores práticas do React
- Use PropTypes no estilo TypeScript para validação de props
- Escreva nomes descritivos para componentes e funções
- Mantenha componentes pequenos e focados

## 📝 Atualizações Recentes

### Correções de Bugs Concluídas
1. **Correção de Botão Duplicado**: Removidos botões "Finalizar" duplicados
2. **Visibilidade de Botões**: Corrigidos botões aparecendo quando não há itens no carrinho
3. **Validação em Nível de Rota**: Validação de caixa movida para nível de rota
4. **Estados de Carregamento**: Adicionados loaders ao modal de fechamento de caixa

### Melhorias na Qualidade do Código
- Tratamento de erros aprimorado
- Experiência do usuário melhorada com estados de carregamento
- Melhor separação de responsabilidades
- Formatação de código consistente

## 📄 Licença

Este projeto está licenciado sob uma licença privada.

## 👨‍💻 Autor

**Equipe BotFoods**
- Email: contato@botfoods.com.br
- Website: https://botfoods.com.br

## 🆘 Suporte

Para suporte e dúvidas:
- Email: contato@botfoods.com.br
- Documentação: Verifique os comentários no código
- Issues: Crie uma issue no repositório

## 🔮 Melhorias Futuras

- **Modo Offline**: Funcionar sem conexão com internet
- **Gestão de Estoque**: Rastreamento de estoque e alertas
- **Dashboard de Analytics**: Métricas de vendas e performance
- **App Mobile**: Aplicação mobile complementar
- **Suporte Multi-idioma**: Internacionalização
- **Comandos de Voz**: Pedidos ativados por voz
- **Leitura de Código de Barras**: Identificação de produtos via código de barras
