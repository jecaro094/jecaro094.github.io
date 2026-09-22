---
title: LLM Delivery Pipeline
tagline: Confidential distribution of an LLM through Kubernetes with encryption and signing
---

:::hero{cover="/media/covers/llm-delivery-pipeline.webp" repo="https://github.com/jecaro094/llm_delivery_pipeline" docs="https://jecaro094.github.io/tech-docs/projects/llm-delivery-pipeline/"}
# LLM Delivery Pipeline

Confidential distribution of an LLM through Kubernetes with encryption and signing
:::

## 🔐 Context {#context}

Imagine you need to ship a machine-learning model to a Kubernetes cluster you
don't fully trust, over a **public** distribution channel you don't control
either. The model has to arrive in one piece, unread by anyone in between, and
you need to know it's really *your* model and not a swapped-in fake.

This project is a proof of concept for exactly that: a **producer** encrypts a
model and publishes the ciphertext to a public Hugging Face Hub repository, and
a **consumer** running in Kubernetes downloads it, decrypts it in memory, and
loads it — all without the Hub or anyone watching the wire ever seeing the
plaintext.

:::tip[Why it matters]
All confidentiality lives in the encryption key, which never leaves the
cluster. That's what makes publishing the ciphertext *publicly* a legitimate
design choice instead of a leak: without the key, the artifact is just noise.
:::

A second, optional layer adds **Ed25519 signing**, so a consumer can also
verify the model came from a trusted producer and wasn't swapped for something
else — without ever needing the decryption key to do that check.

## 🔀 Explanation {#explanation}

### 🌟 High-Level Flow (Non-Technical)

:::flow
1. **📦 Encrypt** — The producer downloads a public Hugging Face model, encrypts it with AES-256-GCM, and builds a manifest describing it.
2. **☁️ Publish** — The encrypted artifact and manifest are uploaded to a public Hugging Face Hub repository — no secrets in the upload.
3. **🔑 Deliver the key** — The decryption key is mounted into the consumer pod as a Kubernetes Secret, never as an environment variable.
4. **⬇️ Download** — The consumer pulls the ciphertext from the Hub — no authentication token required.
5. **🧠 Decrypt in memory** — Decryption happens in chunks on a `tmpfs` volume; the plaintext model never touches disk.
6. **✍️ Verify (optional)** — With the signing extension enabled, the consumer checks an Ed25519 signature against a public key delivered separately from the artifact, before trusting the manifest at all.
:::

:::info[Want the full technical breakdown?]
The encrypted container format, manifest schema, key derivation and the full
threat model are written up in the
[technical documentation](https://jecaro094.github.io/tech-docs/projects/llm-delivery-pipeline/).
:::

## 🧱 Architecture {#architecture}

:::steps
1. **Producer (Kubernetes Job)** — Downloads the model, encrypts it with AES-256-GCM, derives a per-artifact key via HKDF-SHA256, and uploads the ciphertext and manifest to the Hub.
2. **Encrypted container format** — A self-describing binary format: a header with algorithm/KDF/salt metadata, followed by chunked ciphertext, each chunk authenticated with its own GCM tag.
3. **Consumer (Kubernetes Pod)** — Mounts the decryption key as a read-only Secret, downloads the ciphertext, streams it through decryption onto a memory-backed `tmpfs` volume, then loads the model.
4. **Signing extension (`layer_2` branch)** — Adds a signing private key (producer-only Secret) and a verification public key (consumer-only ConfigMap, deliberately delivered through a different channel than the artifact itself).
:::

:::note[Defense in depth, not perfection]
The project documents its own open issues too — cluster admins can still read
Secrets directly, and a compromised producer can sign malicious content
validly. Closing those gaps is sketched out as future work using
attestation-gated key release, but isn't implemented.
:::

## Technologies {#technologies}

:::grid
### 🔒 AES-256-GCM + HKDF-SHA256

- Authenticated symmetric encryption
- Per-artifact keys derived from a master key
- Deterministic counter-based nonces, chunk-bound AAD

### ✍️ Ed25519 (layer_2)

- Deterministic digital signatures for the manifest
- Verification key delivered independently of the artifact
- Standalone `verify` command, no decryption key needed

### ☸️ Kubernetes

- Producer Job, consumer Pod
- Secrets and ConfigMaps for key/material delivery
- `tmpfs` `emptyDir` so plaintext never touches disk

### 🤗 Hugging Face Hub

- Public repository as the distribution channel
- No authentication required to download

### 🐍 Python

- Encryption, signing and verification tooling
- Unit tests plus an end-to-end path against a real Hub repo

### 🧪 CI/CD

- quality → test → security → k8s-manifests → build
- Manifests validated against an ephemeral `kind` cluster
:::

## Run it {#run}

:::repos
- https://github.com/jecaro094/llm_delivery_pipeline
- https://github.com/jecaro094/llm_delivery_pipeline/tree/layer_2
:::

## Documentation {#docs}

:::docs
- [LLM Delivery Pipeline](https://jecaro094.github.io/tech-docs/projects/llm-delivery-pipeline/)
:::
