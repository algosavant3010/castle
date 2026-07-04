"use client";

import { useState, useEffect, useCallback } from "react";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";

import { GLOW_PROPS } from "@/lib/ui";

/**
 * /policies - Reusable policy templates
 *
 * Users create and manage their own templates stored in localStorage.
 * These get applied when registering new agents via the connect-agent flow.
 */

export interface PolicyTemplate {
  id: string;
  name: string;
  expiry: string;
  cap: string;
  targets: string;
  fns: string;
  createdAt: string;
}

const STORAGE_KEY = "castle_policy_templates";

function loadTemplates(): PolicyTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: PolicyTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function PoliciesPage() {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("24");
  const [cap, setCap] = useState("50");
  const [targets, setTargets] = useState("");
  const [fns, setFns] = useState("");

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const newTemplate: PolicyTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      expiry: `${expiry}h`,
      cap: `${cap} MON`,
      targets: targets.trim() || "Any",
      fns: fns.trim() || "Any",
      createdAt: new Date().toISOString(),
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);

    // Reset form
    setName("");
    setExpiry("24");
    setCap("50");
    setTargets("");
    setFns("");
    setShowForm(false);
  }, [name, expiry, cap, targets, fns, templates]);

  const handleDelete = useCallback((id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  }, [templates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Policies</h1>
          <p className="mt-1 text-sm text-muted">Templates for agent permissions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "Cancel" : "New template"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-5 space-y-4">
          <h3 className="text-sm font-medium text-text">Create policy template</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-faint mb-1 block">Template name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-faint mb-1 block">Daily cap (MON)</label>
              <input
                type="number"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-faint mb-1 block">Expiry (hours)</label>
              <input
                type="number"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-faint mb-1 block">Allowed targets</label>
              <input
                type="text"
                value={targets}
                onChange={(e) => setTargets(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-faint mb-1 block">Allowed functions (comma-separated)</label>
              <input
                type="text"
                value={fns}
                onChange={(e) => setFns(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="btn btn-primary disabled:opacity-40"
          >
            Save template
          </button>
          </div>
        </BorderGlow>
      )}

      {/* Templates list */}
      {templates.length === 0 && !showForm && (
        <BorderGlow {...GLOW_PROPS}>
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-text">No templates yet</p>
            <p className="mt-1.5 text-sm text-muted">Create templates to quickly configure new agents.</p>
          </div>
        </BorderGlow>
      )}

      {templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((template) => (
            <BorderGlow key={template.id} {...GLOW_PROPS}>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text">{template.name}</h3>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-xs text-danger/60 hover:text-danger transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div>
                    <span className="text-faint">Expiry</span>
                    <p className="font-mono text-muted mt-0.5">{template.expiry}</p>
                  </div>
                  <div>
                    <span className="text-faint">Daily cap</span>
                    <p className="font-mono text-muted mt-0.5">{template.cap}</p>
                  </div>
                  <div>
                    <span className="text-faint">Targets</span>
                    <p className="font-mono text-muted mt-0.5">{template.targets}</p>
                  </div>
                  <div>
                    <span className="text-faint">Functions</span>
                    <p className="font-mono text-muted mt-0.5">{template.fns}</p>
                  </div>
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      )}
    </div>
  );
}
