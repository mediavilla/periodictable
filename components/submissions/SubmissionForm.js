import { useId, useState } from "react";
import {
  SUBMISSION_LIMITS,
  validateSubmissionInput,
} from "../../data/submission-types";
import styles from "../../styles/submission-form.module.css";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export default function SubmissionForm({ type }) {
  const formId = useId();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = {
      kind: type.kind,
      subject,
      message,
      contactEmail,
      sourcePath: type.path,
      website,
      idempotencyKey: createIdempotencyKey(),
    };

    const local = validateSubmissionInput(payload);
    if (local.honeypot) {
      setStatus("success");
      return;
    }
    if (!local.ok) {
      const next = {};
      for (const item of local.errors) next[item.field] = item.message;
      setFieldErrors(next);
      setError("Please fix the highlighted fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.value),
      });

      if (response.status === 429) {
        setError("Too many submissions. Please wait a few minutes and try again.");
        setStatus("error");
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (Array.isArray(data.fields)) {
          const next = {};
          for (const item of data.fields) next[item.field] = item.message;
          setFieldErrors(next);
        }
        setError(data.error || "Could not send your submission.");
        setStatus("error");
        return;
      }

      setSubject("");
      setMessage("");
      setContactEmail("");
      setWebsite("");
      setStatus("success");
    } catch {
      setError("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status">
        <h2>{type.successTitle}</h2>
        <p>{type.successBody}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setStatus("idle")}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.formIntro}>
        <h2 id={`${formId}-title`}>{type.formTitle}</h2>
        <p>{type.formHelp}</p>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-subject`}>{type.subjectLabel}</label>
        <input
          id={`${formId}-subject`}
          name="subject"
          type="text"
          maxLength={SUBMISSION_LIMITS.subjectMax}
          placeholder={type.subjectPlaceholder}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          autoComplete="off"
        />
        {fieldErrors.subject ? (
          <p className={styles.fieldError}>{fieldErrors.subject}</p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-message`}>{type.messageLabel}</label>
        <textarea
          id={`${formId}-message`}
          name="message"
          required
          rows={6}
          minLength={SUBMISSION_LIMITS.messageMin}
          maxLength={SUBMISSION_LIMITS.messageMax}
          placeholder={type.messagePlaceholder}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <p className={styles.hint}>
          {message.trim().length}/{SUBMISSION_LIMITS.messageMax}
        </p>
        {fieldErrors.message ? (
          <p className={styles.fieldError}>{fieldErrors.message}</p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-email`}>Email (optional)</label>
        <input
          id={`${formId}-email`}
          name="contactEmail"
          type="email"
          maxLength={SUBMISSION_LIMITS.emailMax}
          placeholder="you@example.com"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          autoComplete="email"
        />
        <p className={styles.hint}>
          Only used if a reply would help. Never shown publicly.
        </p>
        {fieldErrors.contactEmail ? (
          <p className={styles.fieldError}>{fieldErrors.contactEmail}</p>
        ) : null}
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submit}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : type.submitLabel}
      </button>
    </form>
  );
}
