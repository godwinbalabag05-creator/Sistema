import { useEffect, useState } from "react";

import Modal from "./Modal";
import { supabase } from "../lib/supabaseClient";
import { formatPhone, normalizePhone } from "../lib/phone";

async function messageFrom(error) {
  try {
    const body = await error.context.json();
    if (body?.error) return body.error;
  } catch {
    // keep the default message
  }

  return error.message;
}

function PhoneVerifyModal({ open, onClose, initialPhone = "", onVerified }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [mode, setMode] = useState("sms");

  // Start fresh every time the window opens
  useEffect(() => {
    if (!open) return;

    setStep("phone");
    setPhone(initialPhone);
    setCode("");
    setError("");
    setBusy(false);
    setCooldown(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    const normalized = normalizePhone(phone);

    if (!normalized) {
      setError("Enter a valid Philippine mobile number, like 0917 123 4567.");
      return;
    }

    setError("");
    setBusy(true);

    const { data, error: sendError } = await supabase.functions.invoke(
      "send-phone-code",
      { body: { phone: normalized } }
    );

    setBusy(false);

    if (sendError) {
      setError(await messageFrom(sendError));
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    setMode(data?.mode ?? "sms");
    setPhone(normalized);
    setCode("");
    setCooldown(60);
    setStep("code");
  }

  async function handleVerify(e) {
    e.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setError("");
    setBusy(true);

    const { data, error: verifyError } = await supabase.rpc(
      "verify_phone_otp",
      { p_code: code }
    );

    if (verifyError) {
      setBusy(false);
      setError(verifyError.message);
      return;
    }

    if (!data?.ok) {
      setBusy(false);

      if (data?.reason === "wrong") {
        const left = data.attempts_left;
        setError(
          `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`
        );
      } else if (data?.reason === "locked") {
        setError("Too many wrong attempts. Ask for a new code.");
      } else if (data?.reason === "expired") {
        setError("That code has expired. Ask for a new one.");
      } else {
        setError("Ask for a new code first.");
      }

      return;
    }

    if (onVerified) await onVerified();
    setBusy(false);
    setStep("done");
  }

  let body;
  let footer;

  if (step === "phone") {
    body = (
      <form
        id="phone-step"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
      >
        <p className="modal-text">
          Shops use your number to confirm that a booking is real. We'll send
          a 6-digit code to it by text message.
        </p>

        <label htmlFor="verify-phone">Mobile number</label>
        <input
          id="verify-phone"
          type="tel"
          autoComplete="tel"
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0917 123 4567"
        />

        {error && <p className="form-error">{error}</p>}
      </form>
    );

    footer = (
      <>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          form="phone-step"
          className="primary-button"
          disabled={busy}
        >
          {busy ? "Sending..." : "Send code"}
        </button>
      </>
    );
  } else if (step === "code") {
    body = (
      <form id="code-step" onSubmit={handleVerify}>
        <p className="modal-text">
          Enter the 6-digit code for {formatPhone(phone)}. It expires in 10
          minutes.
        </p>

        <label htmlFor="verify-code">Verification code</label>
        <input
          id="verify-code"
          className="otp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />

        {error && <p className="form-error">{error}</p>}

        {mode === "demo" ? (
          <p className="demo-note">
            Demo mode: the code arrives as an E-Kaniko notification. Look for
            the pop-up at the bottom right, or the bell.
          </p>
        ) : (
          <p className="demo-note">
            We sent a text message to {formatPhone(phone)}. It can take up to
            a minute to arrive.
          </p>
        )}
      </form>
    );

    footer = (
      <>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setStep("phone");
            setError("");
          }}
        >
          Change number
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={sendCode}
          disabled={cooldown > 0 || busy}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>

        <button
          type="submit"
          form="code-step"
          className="primary-button"
          disabled={busy}
        >
          {busy ? "Checking..." : "Verify"}
        </button>
      </>
    );
  } else {
    body = (
      <div className="verify-done">
        <span className="verify-check" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>

        <strong>Number verified</strong>
        <p className="modal-text">
          {formatPhone(phone)} is now verified. You can request bookings.
        </p>
      </div>
    );

    footer = (
      <button type="button" className="primary-button" onClick={onClose}>
        Done
      </button>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify your phone number"
      size="sm"
      footer={footer}
    >
      {body}
    </Modal>
  );
}

export default PhoneVerifyModal;