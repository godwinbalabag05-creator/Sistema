import { useState } from "react";

import { supabase } from "../lib/supabaseClient";

function HelpfulPrompt({ diagnosisId }) {
  const [choice, setChoice] = useState(null);

  async function rate(helpful) {
    if (choice !== null) return;

    setChoice(helpful);

    await supabase.rpc("rate_diagnosis", {
      p_diagnosis: diagnosisId,
      p_helpful: helpful,
    });
  }

  if (choice !== null) {
    return (
      <p className="helpful-note">
        Thanks. Your feedback helps E-Kaniko give better answers.
      </p>
    );
  }

  return (
    <div className="helpful-prompt">
      <span>Was this diagnosis helpful?</span>

      <button
        type="button"
        className="secondary-button"
        onClick={() => rate(true)}
      >
        Helpful
      </button>

      <button
        type="button"
        className="secondary-button"
        onClick={() => rate(false)}
      >
        Not helpful
      </button>
    </div>
  );
}

export default HelpfulPrompt;