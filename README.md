<h1 align="center">📚 Reviu</h1>

<p align="center">
  <b>Estude de forma mais eficaz e divertida.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-3975F6?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-8A3FFC?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3975F6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Android-18D09C?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
</p>

---

## 💜 Sobre o Reviu

O Reviu é um aplicativo mobile voltado para estudantes. A proposta é ajudar o usuário a estudar de forma mais eficaz e divertida por meio de questionários personalizados, revisão de conteúdos e acompanhamento do progresso.

No primeiro acesso, o usuário responde a algumas perguntas sobre seus objetivos e hábitos de estudo. Com essas informações, o aplicativo oferece uma experiência mais personalizada, ajudando cada pessoa a organizar melhor seus estudos e aprender no seu próprio ritmo.

> 🤖 Por enquanto, o Reviu está disponível apenas para **Android**.
>
> 🔌 Este repositório é o app. Ele precisa da API do Reviu rodando para funcionar.

## ✨ O que você encontra no app

- 🎯 **Onboarding personalizado**: perguntas sobre foco, prazo, meta diária e ritmo de estudo
- 🗂️ **Decks de cartas** com a cor que você escolher
- 🔁 **Revisão no ritmo certo**, com repetição espaçada
- 🔥 **Ofensiva**: quantos dias seguidos você estudou
- 👫 **Compartilhe decks** com os amigos

## 🚀 Como entrar no aplicativo

**1. Instale as dependências**

```bash
npm install
```

**2. Crie um arquivo `.env` na raiz** com o endereço da API:

```
EXPO_PUBLIC_API_URL=http://SEU_IP:8080
```

> 💡 No emulador Android, o endereço do seu computador é `10.0.2.2`. No celular, use o IP do computador na mesma rede Wi-Fi.

**3. Inicie o app**

```bash
npx expo start
```

**4. Abra no Android**

- 🤖 Aperte `a` no terminal para abrir no emulador Android
- 📱 Ou escaneie o QR code com o app [Expo Go](https://expo.dev/go) no seu celular Android

## 👋 Primeiro acesso

1. Toque em **Começar** e responda às perguntas sobre os seus estudos
2. Crie a conta e digite o código de 6 dígitos que chega no seu e-mail 📧
3. Faça login e crie o seu primeiro deck 🎉

Já tem conta? Toque em **Fazer Login**.

## 🛠️ Deu algo estranho?

Limpe o cache e inicie de novo:

```bash
npx expo start -c
```

---

<p align="center">Feito com 💜 para quem quer aprender melhor</p>
