---
title: QR voting survey
tagline: Anonymous and secure voting with QR codes
---

:::hero{cover="/media/covers/qr-voting-survey.webp"}
# QR voting survey

Anonymous and secure voting with QR codes
:::

## 🎭 Context {#context}

Imagine going to a 🎭 show, 🎬 movie, or 🎶 concert and wanting to share your thoughts to make it even better.
With this QR-based app 📲, you can give your feedback instantly and anonymously — just scan a QR code with your phone and share your opinion!

:::tip[Example]
At a contest where several groups are performing, the audience can vote for their favorite.
Each person gets a unique QR code, scans it, and sends in their vote. Super simple: **1 QR = 1 vote** ✅
No login, no personal info needed.
:::

And it doesn't stop there 🚀: the system can also collect more detailed feedback, like rating each group
on style, originality, energy, and more.

## Demo {#demo}

::youtube{id="QXVFPCbwpvA" title="Demo QR voting survey"}

## Explanation {#explanation}

### 🌟 High-Level Flow (Non-Technical)

:::flow
1. **👤 Anonymous access** — Each participant gets a unique QR code that represents them anonymously; no personal information is stored.
2. **📲 Scan & access** — Scanning the QR opens a secure voting link, which verifies the participant and grants access.
3. **📝 Cast a vote** — The user selects their choice(s) and submits.
4. **✅ Secure validation** — Each vote is checked, stored anonymously, and linked to its unique QR code.
5. **🚫 One vote per person** — A QR can only be used once. Any duplicate attempt is automatically blocked.
6. **📊 Results for admins** — Only administrators can log in to view aggregated results in real time.
:::

:::::details[🔧 Technical Details (For Developers)]
#### 🔄 Application Flow

![QR voting and authentication flow diagram](/media/schema-qr.webp "QR voting flow between services.")

In the `qr_application` service, QR codes are linked to anonymous users (`user_1`, `password`, e.g.), with encrypted passwords stored in the database.

::::steps
1. **Setup endpoints**

   Two setup endpoints generate the QR codes before participants can vote:

   :::endpoints
   - `POST /token/generate` — Provide username and password to validate against the database and generate a token signed with the `qr_application` secret.
   - `POST /qr` — Create the QR code, authenticating with the token from step 2.a (User Auth).
   :::


2. **Embed the token**

   The generated JWT is embedded in the QR code's URL, which participants later scan.

3. **Scan & access**

   Scanning a QR opens `/vote:<token>` from the dashboard. The token is a JWT signed with a shared secret between Django microservices — the same token generated in step 2.

4. **Cast a vote**

   On the `vote` page, the user selects an option and submits. Submission calls `/token/validate/?option=<option>` in the `qr_application` service (User Auth).

5. **Validate & enforce one use**

   If valid, the vote is saved and `token_used` is set to `True`. In other case, the page returns a controlled error and no vote is saved. Any attempt to reuse a token is blocked (`token_used = True`) and a controlled error page is shown.

6. **Admin access**

   Admins log into `qr_dashboard` with Admin Auth to view aggregated voting graphs (via `/metrics` endpoint in `qr_application`). Typical flow: `/login` → `/dashboard` → `/metrics`. Tokens are stored in the session for ongoing auth and cleared on logout.
::::

#### 🔐 Authentication Types

:::grid{variant="auth"}
### 🔑 JWT Auth

✅ Valid if token not expired and signed with shared secret.

📌 Purpose: General token verification between services.

### 🛡️ Admin Auth

✅ Token valid, user exists in DB, and is admin.

📌 Purpose: Grants administrators access to the dashboard and voting metrics.

### 🙋 User Auth

✅ Token valid, user exists in DB, and is not admin.

📌 Purpose: Used for participant actions (e.g., generating QR, submitting a vote).

### 🤝 Server-to-Server Auth

✅ Token valid and signed with shared secret.

📌 Purpose: Secures internal communication between Django microservices.
:::
:::::

## Technologies {#technologies}

:::grid
### 🐍 Python Backend

- Django microservices.

### 📊 QR Dashboard

- Provides the voting survey UI.
- Displays aggregated voting results.

### 🔲 QR Application

- Handles authentication.
- Manages anonymous users.
- Interacts with the database.

### 📀 Database

- PostgreSQL.
- Stores anonymous user info.
- Stores voting results.
- Stores role definitions.

### 🔵 Render

- Deploys the Django microservices.
- Provides a managed PostgreSQL instance.
- Handles environment variables and secrets.

### 👾 GitHub

- Version control.
- Collaboration.
- Project tracking.
:::
