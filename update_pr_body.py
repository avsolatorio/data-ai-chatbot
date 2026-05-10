import re

with open("pr_body_original.txt", "r") as f:
    body = f.read()

new_table = """### Baseline vs Post-Fix Evaluation Results

3 runs per persona. Scores are mean ± std-dev (0 = fail, 1 = pass).
Baseline run on `feat/compact-agg-renderers` @ `3debe4834`.
Fixed run on `feat/agentic-flow-stability` @ `03d8b16b2`.

| Persona | Failure mode | Metric | Baseline Score | Fixed Score |
|---|---|---|:---:|:---:|
| **AF-4** `agentic_narrator_claim_hallucination` | Narrator invents claim_ids | Narrator Claim Fabrication | `0.77 ± 0.40` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.47 ± 0.47` 🔴 | `1.00` ✅ |
| | | Transcription Fidelity | `0.66 ± 0.48` 🔴 | `1.00` ✅ |
| **AF-5** `agentic_narrator_ranking_drift` | Ranking values reordered/changed | Ranking Fidelity | `0.52 ± 0.41` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.15 ± 0.12` 🔴 | `1.00` ✅ |
| | | Narrator Claim Fabrication | `0.73 ± 0.46` 🔴 | `1.00` ✅ |
| **AF-6** `agentic_compact_compare_decoding` | Positional array decoding errors | Data Accuracy | `0.09 ± 0.08` 🔴 | `1.00` ✅ |
| | | Narrator Claim Fabrication | `0.68 ± 0.56` 🔴 | `1.00` ✅ |
| | | Context Retention | `0.56 ± 0.31` 🔴 | `0.26` 🔴 |
| **AF-7** `agentic_sas_ranking_value_fabrication` | Full value + claim_id fabrication | Narrator Claim Fabrication | `0.55 ± 0.45` 🔴 | `1.00` ✅ |
| | | Data Accuracy | `0.24 ± 0.25` 🔴 | `0.10` 🔴 |
| | | Ranking Fidelity | `0.72 ± 0.49` 🔴 | `1.00` ✅ |
| **AF-8** `agentic_sas_ranking_single_shot` | Unnecessary clarification; no autonomous resolve | Unnecessary Clarification | `0.33 ± 0.57` 🔴 | `0.00` 🔴 |
| | | Narrator Claim Fabrication | `0.39 ± 0.53` 🔴 | `1.00` ✅ |
"""

# replace the sections
body = re.sub(r"### Baseline — Pre-Fix.*?(?=### Coverage Gaps)", new_table + "\n", body, flags=re.DOTALL)

with open("pr_body_new.md", "w") as f:
    f.write(body)
