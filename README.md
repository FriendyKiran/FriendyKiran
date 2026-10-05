<!-- Generated from profile.json by scripts/build.mjs. Edit the JSON, not this file. -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg">
  <img src="./assets/hero-dark.svg" alt="Kiran Babu Athina — Machine Learning & AI Engineer. M.S. Data Science @ Texas A&M · Research Assistant, AISLS Lab · College Station, TX" width="100%">
</picture>

<a href="https://kiranbabuathina.com"><img alt="Portfolio" src="https://img.shields.io/badge/Portfolio-00D4FF?style=flat-square&logo=googlechrome&logoColor=white"></a> <a href="https://www.linkedin.com/in/athinakiranbabu"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white"></a> <a href="https://scholar.google.com/citations?user=wWen3jgAAAAJ&hl=en"><img alt="Google Scholar" src="https://img.shields.io/badge/Google_Scholar-4285F4?style=flat-square&logo=googlescholar&logoColor=white"></a> <a href="mailto:kiranathina8@gmail.com"><img alt="Email" src="https://img.shields.io/badge/Email-EA4335?style=flat-square&logo=gmail&logoColor=white"></a>

</div>

### `$ cat model_card.yaml`

```yaml
model_id: FriendyKiran/kiran-babu-athina
pipeline_tag: machine-learning-engineering
base_model: B.Tech ECE (GVP, 2021)
fine_tuned_on:
  - telecom
  - finance
  - healthcare
  - agricultural research
training:
  industry: Tata Consultancy Services, 2021–2023
  graduate: M.S. Data Science, Texas A&M (3.9 GPA)
  current: Research Assistant, Texas A&M AISLS Lab
intended_use:
  - agentic RAG systems
  - LLM fine-tuning (LoRA / QLoRA / PEFT)
  - multimodal + vision-language models
  - production ML pipelines
eval_policy: no model ships without a held-out eval set and a baseline to beat
limitations: will ask for your eval set before your roadmap
license: open to opportunities
```

### `$ trace --request` &nbsp;·&nbsp; how I build retrieval systems

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/pipeline-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/pipeline-light.svg">
  <img src="./assets/pipeline-dark.svg" alt="Animated RAG trace: query, agentic router, knowledge graph / BM25 / FAISS retrievers, rerank and cite, fine-tuned LLM, grounded answer, eval harness" width="100%">
</picture>

### `$ ls ./models` &nbsp;·&nbsp; selected work

<table>
<tr>
<td width="50%"><a href="https://kiranbabuathina.com/#projects"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/kg-rag-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/kg-rag-light.svg">
  <img src="./assets/cards/kg-rag-dark.svg" alt="Agentic RAG over KGs: 98.7% Recall@5" width="100%">
</picture></a></td>
<td width="50%"><a href="https://kiranbabuathina.com/#projects"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/azure-rag-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/azure-rag-light.svg">
  <img src="./assets/cards/azure-rag-dark.svg" alt="Source-Grounded RAG: 95% Hit@5 · MRR 0.925" width="100%">
</picture></a></td>
</tr>
<tr>
<td width="50%"><a href="https://kiranbabuathina.com/#projects"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/retinal-vlm-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/retinal-vlm-light.svg">
  <img src="./assets/cards/retinal-vlm-dark.svg" alt="Retinal Disease VLM: 91% diagnostic accuracy" width="100%">
</picture></a></td>
<td width="50%"><a href="https://github.com/FriendyKiran/Exoplanet-Discovery-using-Machine-Learning"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/exoplanet-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/exoplanet-light.svg">
  <img src="./assets/cards/exoplanet-dark.svg" alt="Exoplanet Discovery: 96.6% classification acc" width="100%">
</picture></a></td>
</tr>
<tr>
<td width="50%"><a href="https://kiranbabuathina.com/#projects"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/clip-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/clip-light.svg">
  <img src="./assets/cards/clip-dark.svg" alt="CLIP-style Contrastive: +17% MSCOCO retrieval" width="100%">
</picture></a></td>
<td width="50%"><a href="https://kiranbabuathina.com/#projects"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cards/livestock-twin-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cards/livestock-twin-light.svg">
  <img src="./assets/cards/livestock-twin-dark.svg" alt="Livestock Digital Twin: 1 min per-animal resolution" width="100%">
</picture></a></td>
</tr>
</table>

<sub>Cards link to the code where it's public, otherwise to the case study on my <a href="https://kiranbabuathina.com/#projects">portfolio</a>.</sub>

### `>>> kiran.fit()` &nbsp;·&nbsp; training log

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/career-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/career-light.svg">
  <img src="./assets/career-dark.svg" alt="Career as a loss curve from B.Tech in 2017 through TCS, Texas A&M, and the AISLS Lab, to the next role" width="100%">
</picture>

<details>
<summary><b><code>$ cat requirements.txt</code></b> &nbsp;·&nbsp; tech stack</summary>

```python
# languages
python  sql  javascript  r

# llm + rag
transformers  peft  langchain  langgraph  faiss-cpu  rank-bm25

# modeling
torch  tensorflow  scikit-learn  xgboost  lightgbm

# serving + apps
fastapi  streamlit  react

# data + infra
pyspark  hadoop  postgresql  mongodb  redis  docker  kubernetes

# cloud
azure-openai  azure-ai-search  azure-ml  aws-sagemaker  aws-ec2
```

</details>

<details>
<summary><b><code>$ cat publications.bib</code></b> &nbsp;·&nbsp; research output</summary>

- **2025** · [An agent-based framework of cattle value discovery system for precision nutrient requirements and utilization prediction of beef cattle](https://www.cabidigitallibrary.org/doi/full/10.5555/20250456444)  
  <sub>K. Kaniyamattam, V. Kulangara-Veettil, P. Kundu, **K. B. Athina**, L. O. Tedeschi · _CABI Digital Library · Vol. 16, Issue 3, p. 449_</sub>

**Certifications:** NVIDIA DLI Certified · Generative AI Fundamentals · PCAP: Python · CCNA: Introduction to Networks

</details>

### `$ watch gh-smi` &nbsp;·&nbsp; live telemetry

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/smi-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/smi-light.svg">
  <img src="./assets/smi-dark.svg" alt="nvidia-smi style panel with live GitHub stats: contributions, streak, repos, recent pushes, and languages" width="100%">
</picture>

<sub>Regenerated daily by a GitHub Action from the GitHub GraphQL API — no third-party stat cards.</sub>

<div align="center">

<br>

**open to ML Engineer · AI Engineer · Data Scientist roles** → [kiranathina8@gmail.com](mailto:kiranathina8@gmail.com)

<sub><code>early_stopping=False</code></sub>

</div>
