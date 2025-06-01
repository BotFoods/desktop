#!/bin/bash

# Script para build e preparação para deploy no GCP Storage
echo "🚀 Iniciando build para GCP Storage..."

# Executa o build do Vite
echo "📦 Executando build..."
npm run build

# Copia o 404.html para a raiz do dist
echo "📋 Copiando arquivos de configuração..."
cp public/404.html dist/404.html
cp public/_redirects dist/_redirects 2>/dev/null || echo "⚠️  Arquivo _redirects não encontrado, pulando..."

# Remove o diretório public desnecessário do dist
echo "🧹 Limpando arquivos desnecessários..."
rm -rf dist/public/

# Cria arquivo .htaccess para servidores Apache (backup)
echo "🔧 Criando .htaccess para fallback..."
cat > dist/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
EOF

# Verifica se os arquivos essenciais estão presentes
echo "🔍 Verificando arquivos essenciais..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: index.html não encontrado!"
    exit 1
fi

if [ ! -f "dist/404.html" ]; then
    echo "❌ Erro: 404.html não encontrado!"
    exit 1
fi

# Lista os arquivos finais
echo "📁 Arquivos no diretório dist:"
ls -la dist/

# Informações finais
echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "📂 Arquivos prontos em: ./dist/"
echo ""
echo "🌐 Para fazer deploy no GCP Storage:"
echo "   1. Configure o bucket: gsutil web set -m index.html -e 404.html gs://SEU_BUCKET"
echo "   2. Faça upload: gsutil -m rsync -r -d ./dist gs://SEU_BUCKET"
echo "   3. Configure o Load Balancer para error page 404 → 404.html"
echo ""
echo "🔗 Para testar localmente:"
echo "   serve dist -s -p 3001"
echo ""
echo "📖 Veja o arquivo GCP_DEPLOY_GUIDE.md para instruções detalhadas"
