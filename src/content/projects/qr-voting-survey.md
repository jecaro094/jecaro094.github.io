---
title: QR voting survey
tagline: Anonymous and secure voting with QR codes
cover: "../../assets/QR voting survey.png"
order: 1
cardName: QR Voting Survey
cardDescription: Anonymous voting system with QR codes for live events
cardTech:
  - Django
  - JWT
  - PostgreSQL
  - Docker
contextHeading: "🎭 Context"
demo:
  youtubeId: QXVFPCbwpvA
  title: Demo QR voting survey
technologies:
  - heading: "🐍 Python Backend"
    items:
      - "Django microservices."
  - heading: "📊 QR Dashboard"
    items:
      - "Provides the voting survey UI."
      - "Displays aggregated voting results."
  - heading: "🔲 QR Application"
    items:
      - "Handles authentication."
      - "Manages anonymous users."
      - "Interacts with the database."
  - heading: "📀 Database"
    items:
      - "PostgreSQL."
      - "Stores anonymous user info."
      - "Stores voting results."
      - "Stores role definitions."
  - heading: "🔵 Render"
    items:
      - "Deploys the Django microservices."
      - "Provides a managed PostgreSQL instance."
      - "Handles environment variables and secrets."
  - heading: "👾 GitHub"
    items:
      - "Version control."
      - "Collaboration."
      - "Project tracking."
---

Imagine going to a 🎭 show, 🎬 movie, or 🎶 concert and wanting to share your thoughts to make it even better.
With this QR-based app 📲, you can give your feedback instantly and anonymously — just scan a QR code with your phone and share your opinion!

<div class="callout">
👉 <strong>Example:</strong> at a contest where several groups are performing, the audience can vote for their favorite.
Each person gets a unique QR code, scans it, and sends in their vote. Super simple: <strong>1 QR = 1 vote</strong> ✅
No login, no personal info needed.
</div>

And it doesn't stop there 🚀: the system can also collect more detailed feedback, like rating each group
on style, originality, energy, and more.
