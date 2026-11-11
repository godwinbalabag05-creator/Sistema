import { useEffect, useRef, useState } from "react";

import Modal from "./Modal";

const MAX_SIDE = 1024;

// Shrinks a photo so it uploads fast and fits the AI limits
function toJpeg(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function cameraMessage(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow the camera for this site in your browser settings, or upload a photo instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. You can upload a photo instead.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again, or upload a photo instead.";
    default:
      return "The camera couldn't be started. You can upload a photo instead.";
  }
}

function PhotoInput({ photo, onChange, disabled }) {
  const uploadRef = useRef(null);
  const captureRef = useRef(null);
  const videoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const cameraSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  // Switch the camera off whenever it is closed or the page is left
  useEffect(
    () => () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    },
    [stream]
  );

  async function openCamera() {
    setError("");

    // Browsers without camera access can still open the phone's camera app
    if (!cameraSupported) {
      captureRef.current?.click();
      return;
    }

    setStarting(true);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(media);
    } catch (err) {
      setError(cameraMessage(err));
    }

    setStarting(false);
  }

  function closeCamera() {
    setStream(null);
  }

  function capture() {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      setError("The camera isn't ready yet. Wait a second and try again.");
      return;
    }

    onChange(toJpeg(video, video.videoWidth, video.videoHeight));
    closeCamera();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError("That image is too large. Choose one under 12 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      onChange(toJpeg(image, image.naturalWidth, image.naturalHeight));
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("That image couldn't be read. Try a JPG or PNG.");
    };

    image.src = url;
  }

  return (
    <div className="photo-box">
      <span className="photo-label">Add a photo (optional)</span>

      {photo ? (
        <div className="photo-preview">
          <img src={photo} alt="Your photo of the vehicle problem" />

          <div className="photo-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={openCamera}
              disabled={disabled || starting}
            >
              Retake
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => uploadRef.current?.click()}
              disabled={disabled}
            >
              Choose another
            </button>

            <button
              type="button"
              className="text-button danger"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={openCamera}
            disabled={disabled || starting}
          >
            {starting ? "Opening camera..." : "Take a photo"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => uploadRef.current?.click()}
            disabled={disabled}
          >
            Upload a photo
          </button>
        </div>
      )}

      <p className="photo-hint">
        A clear photo of the engine, a leak, a warning light or the damaged part
        helps. It is sent to the AI service, so avoid people and plate numbers.
      </p>

      {error && <p className="form-error">{error}</p>}

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      <input
        ref={captureRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />

      <Modal
        open={Boolean(stream)}
        onClose={closeCamera}
        title="Take a photo"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={closeCamera}
            >
              Cancel
            </button>

            <button type="button" className="primary-button" onClick={capture}>
              Capture
            </button>
          </>
        }
      >
        <div className="camera-view">
          <video
            ref={(element) => {
              videoRef.current = element;
              if (element && stream && element.srcObject !== stream) {
                element.srcObject = stream;
              }
            }}
            autoPlay
            playsInline
            muted
          />
        </div>
      </Modal>
    </div>
  );
}

export default PhotoInput;