"use client";

import { useEffect, useState } from "react";

export type PreparationItem = { id: string; label: string; defaultDone?: boolean };

export function PreparationChecklist({ storageKey, items }: { storageKey: string; items: readonly PreparationItem[] }) {
  const defaults = items.filter((item) => item.defaultDone).map((item) => item.id);
  const [checked, setChecked] = useState<string[]>(defaults);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) setChecked(parsed);
        else localStorage.removeItem(storageKey);
      } catch { localStorage.removeItem(storageKey); }
    }
  }, [storageKey]);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return <div className="home-preparation-list">
    <ul>
      {items.map((item) => <li key={item.id}>
        <label>
          <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} />
          <i aria-hidden="true" />
          <b>{item.label}</b>
        </label>
      </li>)}
    </ul>
    <strong className="preparation-progress">{checked.length} / {items.length} 완료</strong>
  </div>;
}
