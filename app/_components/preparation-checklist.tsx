"use client";

import { useEffect, useState } from "react";
import type { PreparationTask } from "../_data/guide-data";
import { PokemonGuideLink } from "./pokemon-guide-link";

const PREPARATION_CHANGE_EVENT = "pokoweek:preparation-change";

function readSaved(storageKey: string, defaults: string[]) {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return defaults;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  } catch { /* reset invalid local data below */ }
  localStorage.removeItem(storageKey);
  return defaults;
}

export function usePreparationState(storageKey: string, items: readonly PreparationTask[]) {
  const defaults = items.filter((item) => item.defaultDone).map((item) => item.id);
  const [checked, setChecked] = useState<string[]>(defaults);

  useEffect(() => {
    const sync = () => setChecked(readSaved(storageKey, defaults));
    const syncStorage = (event: StorageEvent) => { if (event.key === storageKey) sync(); };
    const syncLocal = (event: Event) => { if ((event as CustomEvent<string>).detail === storageKey) sync(); };
    sync();
    window.addEventListener("storage", syncStorage);
    window.addEventListener(PREPARATION_CHANGE_EVENT, syncLocal);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(PREPARATION_CHANGE_EVENT, syncLocal);
    };
  }, [storageKey]); // Item IDs are static for a week; the storage key is the state boundary.

  const toggle = (id: string) => {
    const current = readSaved(storageKey, defaults);
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem(storageKey, JSON.stringify(next));
    setChecked(next);
    window.dispatchEvent(new CustomEvent(PREPARATION_CHANGE_EVENT, { detail: storageKey }));
  };

  const completedCount = items.filter((item) => checked.includes(item.id)).length;
  return { checked, completedCount, toggle };
}

export function PreparationChecklist({ storageKey, items }: { storageKey: string; items: readonly PreparationTask[] }) {
  const { checked, completedCount, toggle } = usePreparationState(storageKey, items);

  return <div className="home-preparation-list">
    <ul>
      {items.map((item) => <li key={item.id}>
        <label>
          <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} />
          <i aria-hidden="true" />
          <b>{item.title}</b>
        </label>
      </li>)}
    </ul>
    <strong className="preparation-progress">{completedCount} / {items.length} 완료</strong>
  </div>;
}

export function PreparationProgress({ storageKey, items }: { storageKey: string; items: readonly PreparationTask[] }) {
  const { completedCount } = usePreparationState(storageKey, items);
  const percentage = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  return <div className="prepare-progress">
    <div><b>{completedCount} / {items.length} 완료</b><strong>{percentage}%</strong></div>
    <span aria-label={`준비도 ${percentage}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><i style={{ width: `${percentage}%` }} /></span>
  </div>;
}

export function PreparationActionChecklist({ storageKey, items }: { storageKey: string; items: readonly PreparationTask[] }) {
  const { checked, toggle } = usePreparationState(storageKey, items);
  return <ul className="prepare-action-list">
    {items.map((item) => <li className={checked.includes(item.id) ? "done" : ""} key={item.id}>
      <label>
        <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} />
        <i aria-hidden="true" />
        <span><b>{item.title}</b><small>{item.reason}</small></span>
      </label>
      {item.href ? <PokemonGuideLink href={item.href}>공략 보기</PokemonGuideLink> : null}
    </li>)}
  </ul>;
}
