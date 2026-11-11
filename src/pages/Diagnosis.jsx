import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import PhotoInput from "../components/PhotoInput";
import { diagnose } from "../lib/diagnose";
import { useVehicles } from "../lib/VehicleContext";

const ADVICE = {
  drive_normally: "Safe to keep driving normally.",
  drive_carefully: "Drive carefully and get it checked soon.",
  do_not_drive: "Do not drive. Arrange a tow or roadside help.",
};

function Diagnosis() {
  const { selectedVehicle, loading } = useVehicles();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isFirstMessage = messages.length === 0;

  async function handleDiagnosis() {
    const text = input.trim();
    if (!text || isAnalyzing || !selectedVehicle) return;

    const nextMessages = [...messages, { role: "user", content: text }];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsAnalyzing(true);

    try {
      const reply = await diagnose(nextMessages, selectedVehicle, photo);

      if (photo && reply.image_used === false) {
        setPhotoNote(
          "The AI couldn't read your photo this time, so this result is based on your description only."
        );
      }

      if (reply.type === "diagnosis") {
        setResult(reply);
      } else {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: reply.message },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while analyzing. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setInput("");
    setPhoto(null);
    setPhotoNote("");
    setResult(null);
    setError("");
  }

  return (
    <>
      <Navbar />

      <main className="page diagnosis-page">

        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>

        {/* Intro */}
        <section className="diagnosis-intro">

          <h1>
            What's happening with your vehicle?
          </h1>

          <p>
            Tell E-Kaniko what you're experiencing.
            Include sounds, warning lights, smells,
            performance issues, or anything unusual
            you've noticed.
          </p>

        </section>

        {/* No vehicle yet */}
        {!loading && !selectedVehicle && (
          <section className="empty-state">
            <h2>Add a vehicle first</h2>
            <p>
              E-Kaniko needs to know which car it's diagnosing.
            </p>
            <Link to="/vehicles" className="primary-button">
              Add your vehicle
            </Link>
          </section>
        )}

        {/* Conversation */}
        {selectedVehicle && messages.length > 0 && (
          <section className="chat-thread">
            {photo && (
              <div className="chat-bubble user photo-bubble">
                <img src={photo} alt="Photo you added" className="chat-photo" />
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-bubble ${message.role}`}
              >
                {message.role === "assistant" && (
                  <span className="chat-bubble-label">
                    E-Kaniko
                  </span>
                )}
                {message.content}
              </div>
            ))}

            {isAnalyzing && (
              <div className="chat-typing">
                E-Kaniko is thinking...
              </div>
            )}
          </section>
        )}

        {/* Form */}
        {selectedVehicle && !result && (
          <section className="diagnosis-form">

            <div className="diagnosing-vehicle">
              Vehicle:{" "}
              <strong>
                {selectedVehicle.year} {selectedVehicle.make}{" "}
                {selectedVehicle.model}
              </strong>{" "}
              <Link to="/vehicles">Change</Link>
            </div>

            <label htmlFor="symptoms">
              {isFirstMessage
                ? "Describe the problem"
                : "Your reply"}
            </label>

            <textarea
              id="symptoms"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isFirstMessage
                  ? "Example: My car makes a clicking sound when I turn left and the steering feels heavier than usual..."
                  : "Type your answer here..."
              }
              rows={isFirstMessage ? 7 : 4}
            />

            {isFirstMessage && (
              <div className="form-hint">
                The more details you provide,
                the better the diagnosis.
              </div>
            )}

            {isFirstMessage && (
              <PhotoInput
                photo={photo}
                onChange={setPhoto}
                disabled={isAnalyzing}
              />
            )}

            {error && (
              <p className="form-error">{error}</p>
            )}

            <button
              type="button"
              className="primary-button diagnose-button"
              onClick={handleDiagnosis}
              disabled={isAnalyzing || !input.trim()}
            >
              {isAnalyzing
                ? "Analyzing..."
                : isFirstMessage
                  ? "Analyze Vehicle"
                  : "Send Reply"}
            </button>

          </section>
        )}

        {/* AI Result */}
        {result && (
          <section className="diagnosis-result">

            <div className="result-header">

              <div>
                <h2>{result.title}</h2>
              </div>

              <span className={`severity ${result.severity}`}>
                {result.severity}
              </span>

            </div>

            {photoNote && <p className="photo-note">{photoNote}</p>}

            <p>{result.summary}</p>

            {result.driving_advice && (
              <div className={`driving-advice ${result.driving_advice}`}>
                {ADVICE[result.driving_advice]}
              </div>
            )}

            <div className="result-grid">

              <div>
                <h3>Possible Causes</h3>

                <ul>
                  {result.causes.map((cause) => (
                    <li key={cause}>{cause}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Recommended Action</h3>

                <p>{result.action}</p>
              </div>

            </div>

            {/* Mechanic CTA */}
            <div className="mechanic-action">

              <div>
                <strong>
                  Need professional help?
                </strong>

                <p>
                  Find mechanics near your location.
                </p>
              </div>

              <Link
                to={`/shops?category=${result.service_category ?? ""}`}
                className="secondary-button"
              >
                Find a Mechanic
              </Link>

            </div>

            <p className="diagnosis-disclaimer">
              This is an AI-generated estimate, not a
              substitute for a certified mechanic's
              inspection.
            </p>

            <button
              type="button"
              className="secondary-button new-diagnosis-button"
              onClick={handleReset}
            >
              Start a New Diagnosis
            </button>

          </section>
        )}

      </main>
    </>
  );
}

export default Diagnosis;