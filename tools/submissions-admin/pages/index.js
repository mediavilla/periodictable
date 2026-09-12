import { useEffect, useMemo, useState } from "react";

const STATUSES = [
  "new",
  "reviewed",
  "accepted",
  "declined",
  "spam",
  "archived",
];

const KINDS = [
  "faq_question",
  "roadmap_suggestion",
  "site_feedback",
  "contact_message",
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function AdminHome() {
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("new");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [nextStatus, setNextStatus] = useState("reviewed");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  async function load() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (kind) params.set("kind", kind);
      if (status) params.set("status", status);
      const response = await fetch(`/api/list?${params.toString()}`, {
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load.");
      setItems(data.items || []);
      if (data.items?.[0]) {
        setSelectedId(data.items[0].id);
        setNotes(data.items[0].reviewer_notes || "");
        setNextStatus(
          data.items[0].status === "new" ? "reviewed" : data.items[0].status,
        );
      } else {
        setSelectedId("");
        setNotes("");
      }
    } catch (err) {
      setError(err.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    setNotes(selected.reviewer_notes || "");
    setNextStatus(selected.status === "new" ? "reviewed" : selected.status);
  }, [selected]);

  async function save() {
    if (!selected) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/update`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: nextStatus,
          reviewerNotes: notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed.");
      setMessage("Saved.");
      await load();
    } catch (err) {
      setError(err.message || "Update failed.");
    }
  }

  return (
    <main className="admin">
      <header className="adminHeader">
        <div>
          <p className="eyebrow">Local only · 127.0.0.1</p>
          <h1>Submission review</h1>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </header>

      <section className="filters">
        <label>
          Kind
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">All</option>
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={load}>
          Apply filters
        </button>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="ok">{message}</p> : null}

      <div className="layout">
        <section className="list" aria-label="Submissions">
          {items.length === 0 ? (
            <p className="empty">No submissions match these filters.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={
                      item.id === selectedId ? "row selected" : "row"
                    }
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="kind">{item.kind}</span>
                    <strong>{item.subject || "(no subject)"}</strong>
                    <span>{formatDate(item.created_at)}</span>
                    <span className="status">{item.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail" aria-label="Submission detail">
          {!selected ? (
            <p className="empty">Select a submission.</p>
          ) : (
            <>
              <p className="meta">
                {selected.kind} · {selected.status} · {selected.source_path}
              </p>
              <h2>{selected.subject || "(no subject)"}</h2>
              <p className="message">{selected.message}</p>
              <p className="meta">
                Email: {selected.contact_email || "—"}
                <br />
                Created: {formatDate(selected.created_at)}
                <br />
                Reviewed: {formatDate(selected.reviewed_at)}
              </p>

              <label>
                Status
                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Reviewer notes
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              <button type="button" onClick={save}>
                Save review
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
