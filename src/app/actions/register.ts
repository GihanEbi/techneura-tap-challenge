// // app/actions/register.ts
// 'use server'

// import { supabase } from '../../../lib/supabase';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function registerPlayer(formData: FormData) {
//   const email = formData.get('email') as string;
//   const full_name = formData.get('full_name') as string;
//   const phone = formData.get('phone') as string;
//   const nickname = formData.get('nickname') as string;

//   // 1. Insert into Supabase
//   const { data, error } = await supabase
//     .from('players')
//     .insert([{ full_name, email, phone, nickname, score: 0 }])
//     .select()
//     .single();

//   if (error) {
//     if (error.code === '23505') return { error: "Email already registered!" };
//     return { error: error.message };
//   }

//   // 2. Generate Game Link
//   // In production, change this to your actual domain
//   const gameLink = `${process.env.NEXT_PUBLIC_BASE_URL}/game?id=${data.id}`;

//   // 3. Send Email via Resend
//   await resend.emails.send({
//     from: 'Game Team <onboarding@resend.dev>', // You'll update this once verified
//     to: email,
//     subject: 'Your Tech Neura Game Link!',
//     html: `<h1>Welcome ${nickname}!</h1><p>Click below to join the game:</p><a href="${gameLink}">Join Game Now</a>`
//   });

//   // Note: For WhatsApp, you would call Twilio/Meta API here.
//   // For now, we focus on getting them into the DB and Email.

//   return { success: true , gameID: data.id };
// }

// app/actions/register.ts
"use server";

import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- REGISTER ---
export async function registerPlayer(formData: FormData) {
  const email = formData.get("email") as string;
  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const nickname = formData.get("nickname") as string;

  // 1. Check if email already exists first
  const { data: existingUser } = await supabase
    .from("players")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    // If user exists, we treat it like a login attempt
    return await checkGameAccess(existingUser.id);
  }

  // 2. Insert new player
  const { data, error } = await supabase
    .from("players")
    .insert([{ full_name, email, phone, nickname, score: 0 }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // 3. Send Email (Optional, kept from your code)
  const gameLink = `${process.env.NEXT_PUBLIC_BASE_URL}/game?id=${data.id}`;
  try {
    await resend.emails.send({
      from: "Game Team <onboarding@resend.dev>",
      to: email,
      subject: "Your Tech Neura Game Link!",
      html: `<h1>Welcome ${nickname}!</h1><p>Click below to join:</p><a href="${gameLink}">Join Game</a>`,
    });
  } catch (e) {
    console.error("Email failed", e);
  }

  return { success: true, gameID: data.id , error: null};
}

// --- LOGIN (ALREADY REGISTERED) ---
export async function loginPlayer(email: string) {
  const { data: user, error } = await supabase
    .from("players")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !user) {
    return { error: "Email not found. Please register first." };
  }

  return await checkGameAccess(user.id);
}

// --- SHARED HELPER: LOCK CHECK ---
async function checkGameAccess(userId: string) {
  // Check the last_seen timestamp
  const { data: player } = await supabase
    .from("players")
    .select("last_seen")
    .eq("id", userId)
    .single();

  if (player?.last_seen) {
    const lastSeen = new Date(player.last_seen).getTime();
    const now = new Date().getTime();
    const diffSeconds = (now - lastSeen) / 1000;

    // If seen within last 20 seconds, assume they are online
    if (diffSeconds < 20) {
      return { error: "This player is currently active on another device." };
    }
  }

  return { success: true, gameID: userId };
}
