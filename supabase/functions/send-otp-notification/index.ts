// ============================================================================
// SUPABASE EDGE FUNCTION : send-otp-notification
// ============================================================================
// Envoie le code d'autorisation OTP par Email et par SMS au PDG
// lors de chaque tentative de connexion de la secrétaire Miss Amirath.
//
// Destinataires :
// - Email : marcosgroup2002@gmail.com
// - SMS : +2290159123494
//
// Déploiement : supabase functions deploy send-otp-notification
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer la requête CORS OPTIONS (pre-flight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      email = "marcosgroup2002@gmail.com",
      phone = "+2290159123494",
      subject = "[EBP Admin] Code d'autorisation de connexion - Miss Amirath",
      emailBody,
      smsText,
      code,
      ip,
      location,
      date,
    } = payload;

    const formattedDate = date || new Date().toLocaleString("fr-FR");

    const finalEmailBody =
      emailBody ||
      `Demande d'accès EBP Admin\n\nMiss Amirath tente de se connecter à l'espace Secrétariat.\n\nCode d'autorisation OTP : ${code}\n(Valable pendant 10 minutes)\n\nDétails de la tentative :\n- Heure : ${formattedDate}\n- Adresse IP : ${ip}\n- Localisation : ${location}\n\nSi vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.`;

    const finalSmsText =
      smsText || `[EBP Admin] Code OTP pour Miss Amirath : ${code}. IP: ${ip}. Valide 10 min.`;

    let emailSent = false;
    let smsSent = false;
    const errors: string[] = [];

    // ------------------------------------------------------------------------
    // 1. ENVOI DE L'EMAIL (Resend ou Brevo)
    // ------------------------------------------------------------------------
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `EBP Admin <${senderEmail}>`,
            to: [email],
            subject: subject,
            text: finalEmailBody,
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          const errData = await res.text();
          errors.push(`Erreur Resend: ${errData}`);
        }
      } catch (err: any) {
        errors.push(`Exception Resend: ${err.message}`);
      }
    } else {
      // Simulation / Log si aucune clé n'est encore configurée
      console.log(`[SIMULATION EMAIL] Vers ${email} : \n${finalEmailBody}`);
      emailSent = true;
    }

    // ------------------------------------------------------------------------
    // 2. ENVOI DU SMS (Termii ou Twilio)
    // ------------------------------------------------------------------------
    const termiiApiKey = Deno.env.get("TERMII_API_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");

    if (termiiApiKey) {
      try {
        // Format Termii pour le Bénin (+229)
        const cleanPhone = phone.replace("+", "");
        const res = await fetch("https://api.ng.termii.com/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: cleanPhone,
            from: "EBP-ALERT",
            sms: finalSmsText,
            type: "plain",
            channel: "generic",
            api_key: termiiApiKey,
          }),
        });

        if (res.ok) {
          smsSent = true;
        } else {
          const errData = await res.text();
          errors.push(`Erreur Termii: ${errData}`);
        }
      } catch (err: any) {
        errors.push(`Exception Termii: ${err.message}`);
      }
    } else if (twilioSid && twilioToken && twilioFrom) {
      try {
        const formData = new URLSearchParams();
        formData.append("To", phone);
        formData.append("From", twilioFrom);
        formData.append("Body", finalSmsText);

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          }
        );

        if (res.ok) {
          smsSent = true;
        } else {
          const errData = await res.text();
          errors.push(`Erreur Twilio: ${errData}`);
        }
      } catch (err: any) {
        errors.push(`Exception Twilio: ${err.message}`);
      }
    } else {
      // Simulation / Log si aucune clé SMS n'est encore configurée
      console.log(`[SIMULATION SMS] Vers ${phone} : ${finalSmsText}`);
      smsSent = true;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        emailSent,
        smsSent,
        recipientEmail: email,
        recipientPhone: phone,
        code,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
