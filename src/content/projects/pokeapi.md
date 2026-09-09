---
title: PokeAPI
tagline: Pokédex with React, FastAPI, and AWS deployment
---

:::hero{cover="/media/covers/pokeapi.webp"}
# PokeAPI

Pokédex with React, FastAPI, and AWS deployment
:::

## Context {#context}

This project is an API that pulls data from the public Pokémon REST API 🐉 ([https://pokeapi.co](https://pokeapi.co)) to show different stats for your favorite Pokémon.

With this custom Pokédex 📖, you can filter Pokémon by name 🔍 and check their stats with just one click on the chosen Pokémon.

It's a simple but stylish way ✨ to see how different technologies can come together to build a fun Pokédex. The same approach can also be applied to real-world cases: building companion apps 🎮, creating interactive dashboards 📊, or teaching beginners how to work with APIs in an engaging way 🚀.

For now, we've kept it simple by using only the PokeAPI REST API ⚡, but the system can easily grow by adding more data and features in the future! 🚀

## Demo {#demo}

::youtube{id="NaE7lj-nMyk" title="Demo PokeAPI"}

## Technologies {#technologies}

:::grid
### 🔵 React frontend

- Graphs for displaying stats 📊
- Tables with pagination (connected to the database)

### 🐍 Python backend

- Framework FastAPI ⚡
- Authentication 🔐
- Unit of Work (UoW) pattern for database operations 🗄️
- DTOs & database models

### 🐳 Docker

- Database container
- Nginx container
- Frontend container
- Backend container

### 🟡 AWS

- Elastic Beanstalk for deployment ☁️

### 👾 GitHub

- GitHub Secrets 🔑
- GitHub Workflows for automated AWS deployment ⚙️
- Version control
:::
