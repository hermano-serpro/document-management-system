# Especificação Completa - Document Management System

## 1. Objetivo

Construir um sistema web simples para upload, listagem e download de documentos por usuário, com armazenamento local de arquivos e metadados mantidos em memória na fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via formulário multipart.
- Listagem de documentos com metadados.
- Download de documento por identificador.
- Associação de documento a um usuário (owner simples, sem autenticação completa nesta fase).
- Interface web para as operações principais.
- API backend seguindo arquitetura em camadas.

### Fora do escopo

- Armazenamento externo (S3, Blob etc.).
- Versionamento de documentos.
- OCR, indexação de conteúdo e busca full-text.
- Controle avançado de permissões (RBAC/ACL).
- Banco de dados persistente de metadados nesta fase.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve permitir upload de um arquivo de documento. |
| RF-02 | O sistema deve registrar metadados do documento apos upload bem-sucedido. |
| RF-03 | O sistema deve listar documentos enviados. |
| RF-04 | O sistema deve permitir filtrar listagem por owner (query string opcional). |
| RF-05 | O sistema deve permitir download de documento por id. |
| RF-06 | O sistema deve retornar erro adequado quando o id nao existir. |
| RF-07 | O sistema deve validar entrada minima (arquivo obrigatorio, owner obrigatorio). |
| RF-08 | O sistema deve expor endpoint de saude da aplicacao. |

## 4. Requisitos nao funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos devem ser gravados no filesystem local usando multer com diskStorage na pasta backend/storage. |
| RNF-02 | Metadados devem permanecer em memoria durante execucao do processo (sem persistencia externa). |
| RNF-03 | Configuracao por variaveis de ambiente (12-Factor). |
| RNF-04 | Backend em Node.js + Express CommonJS. |
| RNF-05 | Frontend em React + Vite com consumo via prefixo /api (proxy). |
| RNF-06 | Arquitetura limpa simples com fluxo routes -> controllers -> services -> repositories. |
| RNF-07 | Tratamento de erros nos limites HTTP com respostas consistentes em JSON para falhas de negocio e validacao. |
| RNF-08 | Codigo legivel e funcoes pequenas, evitando overengineering. |

## 5. Modelo de dados (metadados)

Entidade: DocumentMetadata

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| id | string | sim | Identificador unico do documento (UUID ou equivalente). |
| originalName | string | sim | Nome original do arquivo enviado. |
| filename | string | sim | Nome fisico salvo em disco. |
| mimeType | string | sim | Tipo MIME do arquivo. |
| size | number | sim | Tamanho em bytes. |
| storagePath | string | sim | Caminho relativo do arquivo no storage local. |
| uploadedAt | string (ISO 8601) | sim | Data/hora do upload. |
| owner | string | sim | Identificador textual do dono do documento. |

### Regras do modelo

- id e unico na memoria.
- uploadedAt e gerado pelo backend.
- storagePath aponta para arquivo existente em backend/storage no momento da criacao.
- owner vem da requisicao e nao pode ser vazio.

## 6. Contratos de API

Base URL em desenvolvimento via frontend: /api  
Base real backend local: http://localhost:3000

### 6.1 GET /health

Resposta 200:

```json
{
  "status": "ok"
}
```

### 6.2 POST /upload

Content-Type: multipart/form-data

Campos de entrada:

- file: arquivo binario (obrigatorio)
- owner: string (obrigatorio)

Resposta 201:

```json
{
  "id": "8f2f8a55-2ab7-4f4b-934d-4cbf0d4b7c1d",
  "originalName": "contrato.pdf",
  "filename": "1722879000000-contrato.pdf",
  "mimeType": "application/pdf",
  "size": 245673,
  "storagePath": "storage/1722879000000-contrato.pdf",
  "uploadedAt": "2026-08-05T14:22:10.120Z",
  "owner": "user-123"
}
```

Erros previstos:

- 400 quando arquivo ausente ou owner ausente/invalido
- 413 quando limite de tamanho configurado for excedido
- 500 para falha inesperada de escrita/processamento

Formato padrao de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Arquivo e owner sao obrigatorios"
  }
}
```

### 6.3 GET /documents

Query opcional:

- owner: string

Resposta 200:

```json
{
  "items": [
    {
      "id": "8f2f8a55-2ab7-4f4b-934d-4cbf0d4b7c1d",
      "originalName": "contrato.pdf",
      "filename": "1722879000000-contrato.pdf",
      "mimeType": "application/pdf",
      "size": 245673,
      "storagePath": "storage/1722879000000-contrato.pdf",
      "uploadedAt": "2026-08-05T14:22:10.120Z",
      "owner": "user-123"
    }
  ],
  "total": 1
}
```

Erros previstos:

- 500 para falha inesperada

### 6.4 GET /documents/:id/download

Resposta 200:

- Conteudo binario do arquivo
- Headers recomendados:
  - Content-Type: mimeType salvo
  - Content-Disposition: attachment; filename="nome-original.ext"

Erros previstos:

- 404 quando id nao encontrado nos metadados
- 410 quando metadado existe mas arquivo fisico nao esta mais no disco
- 500 para falha inesperada

Exemplo de erro:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento nao encontrado"
  }
}
```

## 7. Decisoes arquiteturais e riscos

### Decisoes

- Backend em Clean Architecture simples: routes, controllers, services e repositories.
- Repositorio em memoria para metadados e filesystem local para binarios.
- Multer com diskStorage para escrita em backend/storage.
- Frontend consumindo backend via /api com proxy do Vite.
- App backend mantendo endpoint de saude e middleware global de erros.

### Riscos

- Perda de metadados ao reiniciar processo (estado em memoria).
- Possivel divergencia entre metadados e arquivos fisicos (delecao manual no disco).
- Crescimento de uso de memoria com volume alto de documentos.
- Ausencia de autenticacao robusta nesta fase.
- Concorrencia futura pode exigir sincronizacao adicional no repositorio.

## 8. Plano de execucao em etapas

### Etapa 1: Estruturar backend por camadas e contrato base

Acoes:

- Definir composicao das dependencias no backend.
- Criar modulos de rotas, controller, service e repository.
- Registrar rotas de documentos no app principal.

Criterios de aceite:

- Fluxo routes -> controllers -> services -> repositories implementado.
- Rotas /upload, /documents e /documents/:id/download registradas.
- /health continua funcional.

### Etapa 2: Implementar upload local com multer diskStorage

Acoes:

- Configurar pasta de armazenamento local em backend/storage.
- Implementar upload multipart com campo file.
- Validar owner e tratar erros de upload.

Criterios de aceite:

- Upload grava arquivo em backend/storage.
- Metadados retornados no formato especificado.
- Validacao de arquivo e owner com erro 400 quando invalido.

### Etapa 3: Implementar listagem e filtro por owner

Acoes:

- Criar listagem de metadados no repositorio em memoria.
- Aplicar filtro opcional por owner.

Criterios de aceite:

- GET /documents retorna items e total.
- Query owner filtra corretamente.
- Resposta estavel mesmo sem documentos.

### Etapa 4: Implementar download por id com tratamento de erro

Acoes:

- Buscar metadado por id e validar existencia.
- Garantir resposta binaria para arquivo existente.
- Tratar arquivo ausente fisicamente com erro 410.

Criterios de aceite:

- GET /documents/:id/download retorna binario e headers corretos.
- 404 para id inexistente.
- 410 para arquivo ausente no disco.

### Etapa 5: Testes backend (node:test)

Acoes:

- Criar testes para health, upload, listagem e download.
- Cobrir cenarios de erro (400, 404, 410).

Criterios de aceite:

- Suite cobrindo fluxo principal e erros relevantes.
- Execucao verde com script test do backend.

### Etapa 6: Implementar frontend minimo funcional

Acoes:

- Criar formulario de upload com owner e arquivo.
- Criar listagem de documentos com filtro por owner.
- Criar acao de download por item.

Criterios de aceite:

- Usuario consegue enviar, listar e baixar documentos pela UI.
- Chamadas usam /api com proxy do Vite.

### Etapa 7: Hardening e validacoes finais

Acoes:

- Revisar mensagens de erro ao usuario.
- Validar configuracao por ambiente.
- Revisar robustez de IO local e limpeza de estado em testes.

Criterios de aceite:

- Mensagens claras em portugues para usuario.
- Fluxo fim a fim validado manualmente e por testes.
