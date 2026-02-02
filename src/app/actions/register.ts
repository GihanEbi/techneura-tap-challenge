// app/actions/register.ts
'use server'

import { supabase } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registerPlayer(formData: FormData) {
  const email = formData.get('email') as string;
  const full_name = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;
  const nickname = formData.get('nickname') as string;

  // 1. Insert into Supabase
  const { data, error } = await supabase
    .from('players')
    .insert([{ full_name, email, phone, nickname, score: 0 }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { error: "Email already registered!" };
    return { error: error.message };
  }

  // 2. Generate Game Link
  // In production, change this to your actual domain
  const gameLink = `${process.env.NEXT_PUBLIC_BASE_URL}/game?id=${data.id}`;

  // 3. Send Email via Resend
  await resend.emails.send({
    from: 'Game Team <onboarding@resend.dev>', // You'll update this once verified
    to: email,
    subject: 'Your Tech Neura Game Link!',
    html: `<h1>Welcome ${nickname}!</h1><p>Click below to join the game:</p><a href="${gameLink}">Join Game Now</a>`
  });

  // Note: For WhatsApp, you would call Twilio/Meta API here.
  // For now, we focus on getting them into the DB and Email.

  return { success: true , gameID: data.id };
}