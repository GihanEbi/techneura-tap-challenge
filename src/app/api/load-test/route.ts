import { NextResponse } from "next/server";
import { registerPlayer } from "@/app/actions/register";

export async function POST() {
  // 1. Generate Fake Data to bypass "Email already exists" errors
  const randomId = Math.floor(Math.random() * 1000000);

  const formData = new FormData();
  formData.append("full_name", "Load Tester");
  formData.append("nickname", `Bot_${randomId}`);
  formData.append("email", `loadtest_${randomId}@example.com`);
  formData.append("phone", `555${randomId}`);

  // 2. Call your actual registration logic
  const result = await registerPlayer(formData);

  return NextResponse.json(result);
}
