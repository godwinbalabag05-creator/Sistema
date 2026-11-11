import { useState } from "react";

import PhoneVerifyModal from "./PhoneVerifyModal";
import { useAuth } from "../lib/AuthContext";

function VerifyBanner() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);

  const needsVerification =
    profile && profile.role === "user" && !profile.phone_verified_at;

  return (
    <>
      {needsVerification && (
        <div className="verify-banner" role="status">
          <p>
            <strong>Verify your phone number to book a mechanic.</strong> Shops
            use it to confirm that bookings are real.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setOpen(true)}
          >
            Verify now
          </button>
        </div>
      )}

      <PhoneVerifyModal
        open={open}
        onClose={() => setOpen(false)}
        initialPhone={profile?.phone ?? ""}
        onVerified={refreshProfile}
      />
    </>
  );
}

export default VerifyBanner;