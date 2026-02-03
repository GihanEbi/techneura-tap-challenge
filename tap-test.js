import http from "k6/http";
import { sleep, check } from "k6";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://frghvslprgekjotxrmbr.supabase.co"; // Replace with your URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZ2h2c2xwcmdla2pvdHhybWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NzQ3MjcsImV4cCI6MjA4NTQ1MDcyN30.evZ94mXeelum0KDFaaQkErnajwH1yYMnhj0qzxRsUqI"; // Replace with your Anon Key

// Simulation Settings
export const options = {
  scenarios: {
    tap_storm: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 100 }, // 1. Ramp up to 100 users quickly
        { duration: "30s", target: 100 }, // 2. Stay there (The "Storm")
        { duration: "10s", target: 0 }, // 3. Ramp down
      ],
    },
  },
};

export default function () {
  // 1. Generate a random dummy User ID for this Virtual User (VU)
  // In a real test, you might want to use real IDs, but for load testing DB writes,
  // generating random UUID-like strings is often enough to test the write capacity.
  const fakeUserId = `user-${__VU}-${Date.now()}`;

  // 2. Simulate the "Tap" Logic
  // Your app logic: const change = colorMode === "gold" ? 1 : -3;
  // We'll simulate a mix of both.
  const isGold = Math.random() > 0.5;
  const scoreChange = isGold ? 1 : -3;

  // We need to fetch the current score first (Simulating the optimistic update reading)
  // Ideally, we just fire the write to test throughput.

  const payload = JSON.stringify({
    score: Math.floor(Math.random() * 100) + scoreChange, // Mocking the new score
    last_seen: new Date().toISOString(),
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal", // optimization: don't ask DB to send back the full row
    },
  };

  // 3. The "TAP" Request
  // This hits: PATCH /rest/v1/players?id=eq.{fakeUserId}
  // Note: Since we are using fake IDs that might not exist, this might return 404s
  // unless we insert them first.

  // ALTERNATIVE STRATEGY FOR PURE WRITE TESTING:
  // We will hit a specific TEST USER ID to see if the DB locks up.
  const TARGET_TEST_USER_ID = "a8446343-33fc-4809-ac68-7756072f4a1f"; // Ensure this user exists in your DB!

  const res = http.patch(
    `${SUPABASE_URL}/rest/v1/players?id=eq.${TARGET_TEST_USER_ID}`,
    payload,
    params,
  );

  // 4. Verification
  check(res, {
    "Tap successful (204)": (r) => r.status === 204,
    "Tap failed (High Load?)": (r) => r.status !== 204,
  });

  // 5. Simulate human delay between taps (e.g., tapping 2-4 times per second)
  sleep(Math.random() * 0.3 + 0.2);
}
