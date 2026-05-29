<div align="center">
  <img src="assinatura.png" alt="Quadra Azul" width="100" />

  # Sorteio de Times — Quadra Azul

  **Organize times de vôlei equilibrados em segundos.**  
  Aplicação web offline, sem instalação, sem dependências.

  ![Status](https://img.shields.io/badge/status-ativo-brightgreen)
  ![Licença](https://img.shields.io/badge/licen%C3%A7a-privado-red)
  ![Plataforma](https://img.shields.io/badge/plataforma-web%20%7C%20PWA-blue)
  ![Dependências](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-lightgrey)
</div>

---

## Sobre o App

O **Sorteio de Times** foi criado para facilitar a organização das peladas de vôlei na **Quadra Azul**. Com um único toque, o app distribui os jogadores presentes em times equilibrados, levando em conta a habilidade de cada um, a distribuição de mulheres e a presença de levantadores.

Funciona 100% offline, salva tudo no navegador e pode ser instalado como app no celular.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Gerenciar jogadores** | Adicione, edite e remova jogadores da lista |
| **Habilidade por estrelas** | Atribua de 1 a 5 estrelas para cada jogador |
| **Funções** | Marque jogadoras como **Mulher (M)** e/ou **Levantadora (L)** |
| **Sorteio inteligente** | 900 tentativas de otimização para os times mais equilibrados |
| **Arrastar e soltar** | Mova jogadores entre times após o sorteio |
| **Travar jogadores** | Fixe até 2 jogadores por time para impedir redistribuição |
| **Sugestão de troca** | O app sugere a melhor troca para reequilibrar os times |
| **Exportar resultado** | Copia o sorteio para a área de transferência com um toque |
| **Tema claro/escuro** | Muda automaticamente com a preferência do seu sistema |
| **PWA** | Instale como app nativo no celular ou computador |
| **Funciona offline** | Nenhuma conexão com internet necessária |

---

## Como Usar — Manual Passo a Passo

### 1. Selecionar os Jogadores Presentes

Na tela principal você verá a lista de todos os jogadores cadastrados.

- **Toque em um jogador** para marcá-lo como presente (ficará destacado)
- O contador no topo mostra quantos estão selecionados e quantos times serão formados
- Toque novamente para desmarcar

> **Dica:** O app define automaticamente o número de times:
> - Até 10 jogadores → 2 times
> - Até 18 jogadores → 3 times
> - Mais de 18 jogadores → 4 times

---

### 2. Sortear os Times

Com os jogadores selecionados, toque no botão **"Sortear Times"**.

O algoritmo roda **900 tentativas** e escolhe a combinação com melhor equilíbrio, considerando:

1. **Força total** — soma das estrelas de cada time
2. **Mulheres** — distribuídas igualmente entre os times
3. **Levantadores** — pelo menos 1 por time quando possível

O resultado mostra a **qualidade do sorteio**: Ótimo / Bom / Regular / Ok.

---

### 3. Ajustar os Times (opcional)

Após o sorteio, você pode fazer ajustes manuais:

#### Arrastar jogadores
- **No celular:** segure o card do jogador por ~0,3 segundos e arraste para outro time
- **No computador:** clique e arraste normalmente

#### Travar jogadores
- Toque no ícone de cadeado em um jogador para travá-lo no time atual
- Jogadores travados não são afetados por re-sorteio
- Máximo de **2 jogadores travados por time**

#### Sugestão de troca
- Ao mover um jogador, o app mostra uma sugestão de troca para reequilibrar
- Aceite ou ignore a sugestão

---

### 4. Exportar o Resultado

Toque em **"Exportar"** para copiar o sorteio para a área de transferência.  
Cole direto no WhatsApp, Telegram ou qualquer chat.

---

## Gerenciar Jogadores

### Adicionar um jogador

1. Toque em **"+ Novo Jogador"**
2. Preencha o nome
3. Defina a habilidade (1 a 5 estrelas)
4. Marque se é **Mulher** e/ou **Levantadora**
5. Toque em **"Salvar"**

### Editar um jogador

- Toque no ícone de lápis ao lado do nome do jogador

### Remover um jogador

- Toque no ícone de lixeira ao lado do nome do jogador

> Todos os dados são salvos automaticamente no navegador. Nenhuma conta ou internet necessária.

---

## Instalar como App (PWA)

Você pode instalar o Sorteio de Times como um aplicativo nativo no seu celular ou computador — funciona como um app baixado da loja, mas sem precisar instalar nada.

### No Android (Chrome)
1. Abra o app no Chrome
2. Toque nos três pontinhos (menu)
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme

### No iPhone (Safari)
1. Abra o app no Safari
2. Toque no ícone de compartilhar (quadrado com seta)
3. Selecione **"Adicionar à Tela de Início"**
4. Confirme

### No computador (Chrome/Edge)
1. Abra o app no navegador
2. Clique no ícone de instalação na barra de endereço (ícone de download)
3. Clique em **"Instalar"**

---

## Rodando Localmente

O app é um arquivo HTML único — basta abrir no navegador.

```bash
# Opção 1: Abrir direto
# Dê duplo clique em index.html

# Opção 2: Servidor local com Python
python -m http.server 8000
# Acesse http://localhost:8000

# Opção 3: Com Node.js
npx http-server

# Opção 4: VS Code — extensão Live Server
# Clique em "Go Live" no rodapé do VS Code
```

**Requisitos:** qualquer navegador moderno (Chrome, Firefox, Edge, Safari 12+).  
Sem Node.js, sem npm, sem instalação — só abrir e usar.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura e marcação semântica |
| **CSS3** | Estilos, temas claro/escuro, layout responsivo |
| **JavaScript (ES6)** | Toda a lógica do app — sem frameworks |
| **LocalStorage** | Persistência de dados no navegador |
| **Web App Manifest** | Suporte a PWA |
| **Drag & Drop API** | Arrastar jogadores entre times |
| **Clipboard API** | Exportar resultado |

**Nenhuma dependência externa.** Zero bibliotecas, zero frameworks, zero build.

---

## Estrutura do Projeto

```
qa.sorteio-cpz/
├── index.html          # App completo (HTML + CSS + JS em um arquivo)
├── manifest.json       # Configuração PWA
├── favicon.png         # Ícone do app
├── assinatura.png      # Logo Quadra Azul
└── cpz-assinatura.png  # Assinatura de rodapé
```

---

## Detalhes Técnicos

- **Jogadores padrão:** 42 jogadores pré-cadastrados
- **Tamanho máximo por time:** 6 jogadores
- **Validade do sorteio:** 15 minutos (após isso, o cache é limpo)
- **Tentativas de sorteio:** 900 iterações por clique
- **Armazenamento:** `localStorage` (dados ficam no seu dispositivo)

---

<table width="100%" bgcolor="white"><tr><td align="center" style="padding: 16px;">
  <img src="cpz-assinatura.png" alt="CPZ" width="200" />
  <br/>
  <sub>Feito com dedicação para a galera da Quadra Azul</sub>
</td></tr></table>
