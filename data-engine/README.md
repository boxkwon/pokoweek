# POKOWEEK Data Engine v1

Phase B-1 implements the factual pipeline for Kyurem, White Kyurem, and Black Kyurem. Reshiram and Zekrom are normalized as fusion references. Phase B-2A adds an OpenAI structured-output candidate generator without publishing its output.

The default workflow is now the zero-cost manual AI path: export compact evidence packages, author a schema-shaped draft in ChatGPT or Codex, import it as a pending candidate, validate it, and require explicit human approval before publication. The paid OpenAI adapter remains optional and disabled by default.

## Pipeline status

1. `Collect`: PoGo API snapshots are saved under ignored `data/raw/` run directories.
2. `Normalize`: target forms, stats, types, move pools, evidence, and manual official fusion facts are written as versioned JSON.
3. `Generate`: provider-neutral interface plus an OpenAI Responses API adapter. Generated data remains a pending candidate.
4. `Validate`: schemas, evidence references, fusion invariants, moves, source staleness, structural completeness, and editorial readiness are checked separately.
5. `Approve / Publish`: not performed by B-2A. The current approved application overlay remains intentionally empty.

## Commands

```bash
npm run data:collect -- --pokemon kyurem
npm run data:normalize -- --pokemon kyurem
npm run data:generate -- --pokemon kyurem --model <model> --input-price <usd-per-million> --output-price <usd-per-million> --price-checked-at <iso-date> --price-source-url <official-url> --max-output-tokens 3000 --max-cost-usd 0.25 --max-retries 1
npm run data:manual:prepare
npm run data:manual:import -- --input data/manual/drafts/kyurem-family.json --tool codex --model <authoring-model> --written-at <iso-date>
npm run data:validate -- --pokemon kyurem
npm run data:test
```

The prepare command writes one compact package per Pokémon plus `data/manual/packages/guide-candidate-prompt.md`. The import command checks all three package hashes, adds `generationMethod: manual_ai`, records the authoring tool/model/time, writes a pending candidate bundle, and produces validation and human-review reports. It never fixes invalid content or publishes it automatically.

Human approval and publication are deliberately separate destructive boundaries:

```bash
npm run data:approve -- --reviewer <name> --confirm
npm run data:publish -- --confirm
```

Approval is rejected for structurally incomplete, editorially unready, or invalid candidates. Publication additionally requires verified factual and fusion evidence, a current matching approval manifest, and approved status for all three candidates. Until those checks pass, `data/approved/app-guide-overlays.json` remains unchanged.

`data:generate` is a dry run by default. It calculates the conservative three-call budget and does not require a key, contact OpenAI, or write a candidate. A later explicitly approved live run must add `--execute` and set `OPENAI_API_KEY` in the server/CLI environment.

The model and prices intentionally have no source-code defaults. Copy current values from the official OpenAI model and pricing pages, record the check time, and inspect the dry-run budget before every paid run. The live runner is sequential, supports at most two retries, blocks a run whose worst-case estimate exceeds `--max-cost-usd`, and writes all three candidates atomically only after all calls succeed.

Candidate output is stored in `data/candidates/kyurem-family.json`. Validation and the human review summary are stored separately. Prompts, raw model responses, and API keys are excluded from execution logs.

Only `--pokemon kyurem` is supported in v1. A failed collection never modifies approved application data.

## Source policy

- PoGo API is fetched with a named user agent and recorded with endpoint URL, retrieval time, provider hash when available, and a local content hash.
- Official Pokémon GO pages are not scraped. Reviewed claims are registered manually in `data/evidence/manual/` with `rawCollected: false`.
- Raw API responses are cache files and are excluded from Git.
- Candidate or fixture data is never imported by the application.
- Only `data/approved/app-guide-overlays.json` can overlay the current production guide data.

## Phase B-2 environment

The external generator will require server/CLI-only variables. Do not use a `NEXT_PUBLIC_` prefix.

```dotenv
OPENAI_API_KEY=<secret>
POKOWEEK_ENABLE_PAID_AI=true
```

Never use a `NEXT_PUBLIC_` variable for this key. Even with `--execute`, the paid path is blocked unless `POKOWEEK_ENABLE_PAID_AI=true` is deliberately set. The manual workflow and tests make no paid API calls.
