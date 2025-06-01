# Configuração para GCP Cloud Storage + Load Balancer

## Instruções de Deploy para GCP Storage

### 1. Configuração do Bucket
```bash
# Criar bucket (se ainda não existir)
gsutil mb gs://SEU_BUCKET_NAME

# Configurar como website
gsutil web set -m index.html -e 404.html gs://SEU_BUCKET_NAME

# Tornar público
gsutil iam ch allUsers:objectViewer gs://SEU_BUCKET_NAME
```

### 2. Upload dos arquivos
```bash
# Fazer build
npm run build:gcp

# Upload para o bucket
gsutil -m rsync -r -d ./dist gs://SEU_BUCKET_NAME
```

### 3. Configuração do Load Balancer
No console do GCP, configure o Load Balancer para:

- **Backend**: Apontar para o bucket do Cloud Storage
- **Error page**: Configurar 404 para servir `/404.html`
- **Default page**: Configurar para servir `/index.html`

### 4. Configuração de Custom Error Pages
No Load Balancer, adicione:
- Error Code: 404
- Error Content: 404.html
- Override Response Code: 200

### 5. SSL e Domínio
- Configure o certificado SSL
- Aponte seu domínio para o IP do Load Balancer

## Como funciona a solução

1. **404.html**: Captura URLs diretas e redireciona para index.html com parâmetros
2. **index.html**: Processa o redirecionamento e restaura a rota correta
3. **React Router**: Renderiza o componente correto baseado na rota

## Testando localmente
```bash
npm run build:gcp
npx serve dist -s
```
