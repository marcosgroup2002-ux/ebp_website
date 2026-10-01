// ============================================================================
// SERVICE D'AUTHENTIFICATION & OTP MULTI-RÔLES (EBP PRODUCTION)
// ============================================================================
// Gestion rigoureuse des 3 rôles :
// 1. Secrétaire : Miss Amirath (josiasdevweb@gmail.com / EbpSec2026!Secr / +229 0168897793)
//    -> Déclenchement d'OTP transmis au PDG par Email et par SMS + Notification d'audit (Date, Heure, IP, Lieu)
// 2. Coachs : 6 coachs (4 Calavi, 2 Cotonou)
//    -> Mot de passe unifié partagé 'Mon-cours'
// 3. PDG : Mr Sessou Fernando (marcosgroup2002@gmail.com / EbpBoss2026#Master / +229 0159123494)
//    -> Accès Maître Supervision & Validation OTP

import { supabase } from "../lib/supabaseClient";
import { getClientNetworkDetails, logAuditEvent } from "./auditService";

export const CREDENTIALS = {
  secretaire: {
    name: "Miss Amirath (Secrétaire)",
    email: "josiasdevweb@gmail.com",
    phone: "+229 0168897793",
    password: "EbpSec2026!Secr",
    role: "secretaire",
  },
  coach: {
    name: "Équipe Coachs EBP",
    sharedPassword: "Mon-cours",
    role: "coach",
  },
  pdg: {
    name: "Mr Sessou Fernando (PDG)",
    email: "marcosgroup2002@gmail.com",
    phone: "+229 0159123494",
    password: "EbpBoss2026#Master",
    role: "pdg",
  },
};

const OTP_STORAGE_KEY = "ebp_active_otp_requests";

/**
 * Génère un code OTP aléatoire à 6 chiffres.
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoie une alerte OTP par Email et par SMS au PDG (Mr Sessou Fernando).
 * Destinataires :
 * - Email : marcosgroup2002@gmail.com
 * - SMS : +2290159123494
 *
 * @param {{
 *   code: string,
 *   ip: string,
 *   location: string,
 *   date?: string
 * }} params
 */
export async function sendOtpNotification({ code, ip, location, date }) {
  const formattedDate =
    date ||
    new Date().toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "medium",
    });

  const pdgEmail = CREDENTIALS.pdg.email; // marcosgroup2002@gmail.com
  const pdgPhone = CREDENTIALS.pdg.phone.replace(/\s+/g, ""); // +2290159123494

  const emailSubject = "[EBP Admin] Code d'autorisation de connexion - Miss Amirath";
  const emailBody = `Demande d'accès EBP Admin
Miss Amirath tente de se connecter à l'espace Secrétariat.

Code d'autorisation OTP : ${code}
(Valable pendant 10 minutes)

Details : ${formattedDate} | IP: ${ip} | Lieu: ${location}`;

  const emailHtml = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h2 style="color: #002B9A; margin-top: 0; font-size: 20px;">Demande d'accès EBP Admin</h2>
  <p style="font-size: 15px; color: #1e293b; line-height: 1.5;">Miss Amirath tente de se connecter à l'espace Secrétariat.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
    <div style="font-size: 13px; color: #64748b; font-weight: 600;">Code d'autorisation OTP :</div>
    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #002B9A; font-family: monospace; margin: 8px 0;">${code}</div>
    <div style="font-size: 12px; color: #94a3b8;">(Valable pendant 10 minutes)</div>
  </div>

  <p style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 0;">
    <strong>Details :</strong> ${formattedDate} | IP: ${ip} | Lieu: ${location}
  </p>
</div>
`.trim();

  const smsText = `[EBP Admin] Code OTP pour Miss Amirath : ${code}. IP: ${ip}. Valide 10 min.`;

  const payload = {
    email: pdgEmail,
    phone: pdgPhone,
    subject: emailSubject,
    emailBody,
    emailHtml,
    smsText,
    code,
    ip,
    location,
    date: formattedDate,
  };

  // === LOG DE DÉBOGAGE (visible dans F12 Console) ===
  console.log("OTP Sent Payload:", payload);

  let emailSent = false;
  let smsSent = false;

  // --- MÉTHODE 1 : Resend API (Envoi réel direct vers https://api.resend.com/emails) ---
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || "";

  if (resendApiKey) {
    try {
      console.log("[authService] Envoi direct vers https://api.resend.com/emails...");
      const resendPayload = {
        from: "EBP Admin <onboarding@resend.dev>",
        to: [pdgEmail],
        subject: emailSubject,
        text: emailBody,
        html: emailHtml,
      };

      let res = null;
      try {
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(resendPayload),
        });
      } catch (directErr) {
        // Si le navigateur bloque l'appel direct pour restriction CORS, bascule transparente sur le proxy Vite/Vercel
        console.warn("[authService] Appel direct bloqué (CORS navigateur), relai via proxy /api/resend/emails...", directErr);
        res = await fetch("/api/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(resendPayload),
        });
      }

      if (res && res.ok) {
        emailSent = true;
        const resData = await res.json().catch(() => ({}));
        console.log("%c[authService] ✅ Email envoyé avec succès via Resend !", "color: green; font-weight: bold;", resData);
      } else if (res) {
        const errData = await res.text();
        console.warn("[authService] ❌ Échec Resend :", res.status, errData);
      }
    } catch (resendErr) {
      console.warn("[authService] ❌ Erreur Resend :", resendErr);
    }
  }

  // --- MÉTHODE 2 : EmailJS (Secours si Resend non disponible) ---
  const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!emailSent && emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const emailjsPayload = {
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        template_params: {
          to_email: pdgEmail,
          to_name: "Mr Sessou Fernando (PDG)",
          subject: emailSubject,
          otp_code: code,
          date_heure: formattedDate,
          ip_address: ip,
          location: location,
          message: emailBody,
        },
      };

      console.log("[authService] Envoi Email de secours via EmailJS...", emailjsPayload);
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailjsPayload),
      });

      if (res.ok) {
        emailSent = true;
        console.log("%c[authService] ✅ Email envoyé avec succès via EmailJS !", "color: green; font-weight: bold;");
      } else {
        const errText = await res.text();
        console.warn("[authService] ❌ Échec EmailJS :", res.status, errText);
      }
    } catch (emailjsErr) {
      console.warn("[authService] ❌ Erreur EmailJS :", emailjsErr);
    }
  }

  // --- MÉTHODE 3 : Supabase Edge Function (si déployée) ---
  if (supabase && !emailSent) {
    try {
      const { data, error } = await supabase.functions.invoke("send-otp-notification", {
        body: payload,
      });
      if (!error && data) {
        emailSent = emailSent || Boolean(data.emailSent);
        smsSent = smsSent || Boolean(data.smsSent);
      }
    } catch (err) {
      console.info("[authService] Supabase Edge Function indisponible :", err.message);
    }
  }

  // --- MÉTHODE 4 : Webhook externe configuré via .env ---
  const webhookUrl = import.meta.env.VITE_OTP_WEBHOOK_URL;
  if (webhookUrl && !emailSent) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const resData = await res.json();
        emailSent = emailSent || Boolean(resData.emailSent);
        smsSent = smsSent || Boolean(resData.smsSent);
      }
    } catch (webhookErr) {
      console.warn("[authService] Erreur appel Webhook OTP :", webhookErr);
    }
  }

  // --- Journalisation console détaillée ---
  console.group("%c[EBP SÉCURITÉ] Résultat envoi OTP au PDG", "color: #002B9A; font-weight: bold;");
  console.log(`✉️ EMAIL → ${pdgEmail} : ${emailSent ? "✅ ENVOYÉ" : "⚠️ NON ENVOYÉ (configurez EmailJS ou Resend dans .env.local)"}`);
  console.log(`📱 SMS  → ${pdgPhone} : ${smsSent ? "✅ ENVOYÉ" : "⚠️ NON ENVOYÉ (configurez Twilio/Termii)"}`);
  console.log(`📌 SUJET : ${emailSubject}`);
  console.log(`🔐 CODE OTP : ${code}`);
  console.groupEnd();

  // --- Audit ---
  await logAuditEvent({
    action: "NOTIFICATION_OTP_ENVOYEE",
    details: `Alerte OTP transmise au PDG. Email: ${emailSent ? "Envoyé" : "Échec/Non-configuré"}, SMS: ${smsSent ? "Envoyé" : "Échec/Non-configuré"}.`,
    user: { name: "Système de Sécurité EBP", role: "system" },
    ip,
    location,
  });

  return {
    emailSent,
    smsSent,
    code,
    emailRecipient: pdgEmail,
    phoneRecipient: pdgPhone,
    emailSubject,
    emailBody,
    smsText,
  };
}

/**
 * Tente la connexion initiale de la secrétaire.
 * Si les identifiants sont corrects, crée une demande OTP, l'envoie par Email & SMS, et notifie l'audit.
 */
export async function initiateSecretaryLogin(email, password) {
  const normEmail = email.trim().toLowerCase();
  if (normEmail !== CREDENTIALS.secretaire.email.toLowerCase() || password !== CREDENTIALS.secretaire.password) {
    throw new Error("Identifiants secrétaire invalides.");
  }

  // Obtenir IP et localisation du client
  const net = await getClientNetworkDetails();
  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  const otpRequest = {
    id: "otp-" + Date.now(),
    email: CREDENTIALS.secretaire.email,
    telephone: CREDENTIALS.secretaire.phone,
    code,
    statut: "pending",
    ip_address: net.ip,
    location: net.location,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  // Envoi direct par Email et SMS au PDG
  const notificationResult = await sendOtpNotification({
    code,
    ip: net.ip,
    location: net.location,
    date: now.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "medium" }),
  });

  otpRequest.notification = notificationResult;

  // Sauvegarde dans le stockage local pour synchronisation
  try {
    const list = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || "[]");
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify([otpRequest, ...list].slice(0, 20)));
  } catch {
    //
  }

  // Écriture Supabase si disponible
  if (supabase) {
    try {
      await supabase.from("otp_requests").insert({
        id: otpRequest.id,
        email: otpRequest.email,
        telephone: otpRequest.telephone,
        code: otpRequest.code,
        statut: otpRequest.statut,
        ip_address: otpRequest.ip_address,
        location: otpRequest.location,
        created_at: otpRequest.created_at,
        expires_at: otpRequest.expires_at,
      });
    } catch (err) {
      console.warn("[authService] Erreur insertion otp_requests Supabase :", err);
    }
  }

  // Traçabilité instantanée dans l'Audit Log
  await logAuditEvent({
    action: "CONNEXION_OTP_DEMANDEE",
    details: `Demande de connexion Secrétaire soumise. Code OTP généré et transmis au PDG par Email (${CREDENTIALS.pdg.email}) et par SMS (${CREDENTIALS.pdg.phone}).`,
    user: { name: CREDENTIALS.secretaire.name, role: "secretaire" },
    ip: net.ip,
    location: net.location,
  });

  return otpRequest;
}

/**
 * Vérifie le code OTP saisi par la secrétaire.
 */
export async function verifySecretaryOtp(code) {
  const trimmed = code.trim();
  const now = new Date().getTime();

  // Recherche dans le stockage local ou Supabase
  let activeRequest = null;
  const localList = (() => {
    try {
      return JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  })();

  activeRequest = localList.find(
    (r) =>
      r.email === CREDENTIALS.secretaire.email &&
      (r.statut === "pending" || r.statut === "approved") &&
      new Date(r.expires_at).getTime() > now &&
      (r.code === trimmed || r.statut === "approved")
  );

  if (!activeRequest && supabase) {
    try {
      const { data } = await supabase
        .from("otp_requests")
        .select("*")
        .eq("email", CREDENTIALS.secretaire.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && (data.statut === "pending" || data.statut === "approved")) {
        const isExpired = new Date(data.expires_at).getTime() <= now;
        if (!isExpired && (data.code === trimmed || data.statut === "approved")) {
          activeRequest = data;
        }
      }
    } catch {
      //
    }
  }

  if (!activeRequest) {
    throw new Error("Code OTP incorrect ou expiré. Veuillez contacter le PDG.");
  }

  // Marquer comme utilisé
  activeRequest.statut = "used";
  try {
    const updated = localList.map((r) => (r.id === activeRequest.id ? { ...r, statut: "used" } : r));
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    //
  }

  if (supabase) {
    try {
      await supabase.from("otp_requests").update({ statut: "used" }).eq("id", activeRequest.id);
    } catch {
      //
    }
  }

  const net = await getClientNetworkDetails();
  await logAuditEvent({
    action: "CONNEXION_REUSSIE",
    details: `Connexion Secrétaire validée avec succès par code OTP.`,
    user: { name: CREDENTIALS.secretaire.name, role: "secretaire" },
    ip: net.ip,
    location: net.location,
  });

  return {
    id: "sec-amirath",
    name: CREDENTIALS.secretaire.name,
    email: CREDENTIALS.secretaire.email,
    phone: CREDENTIALS.secretaire.phone,
    role: "secretaire",
  };
}

/**
 * Connexion de l'espace Coachs avec le mot de passe unifié.
 */
export async function loginCoach(password, coachName = "Équipe Coachs (Calavi / Cotonou)") {
  if (password !== CREDENTIALS.coach.sharedPassword) {
    throw new Error("Mot de passe Coach incorrect.");
  }

  const net = await getClientNetworkDetails();
  await logAuditEvent({
    action: "CONNEXION_COACH",
    details: `Accès en lecture seule à l'Espace Coachs unifié (${coachName}).`,
    user: { name: coachName, role: "coach" },
    ip: net.ip,
    location: net.location,
  });

  return {
    id: "coach-unified",
    name: coachName,
    role: "coach",
  };
}

/**
 * Connexion du PDG avec son mot de passe maître.
 */
export async function loginPdg(email, password) {
  const normEmail = email.trim().toLowerCase();
  if (normEmail !== CREDENTIALS.pdg.email.toLowerCase() || password !== CREDENTIALS.pdg.password) {
    throw new Error("Identifiants PDG invalides.");
  }

  const net = await getClientNetworkDetails();
  await logAuditEvent({
    action: "CONNEXION_PDG",
    details: `Connexion Direction / PDG : Supervision globale & Analytics activée.`,
    user: { name: CREDENTIALS.pdg.name, role: "pdg" },
    ip: net.ip,
    location: net.location,
  });

  return {
    id: "pdg-fernando",
    name: CREDENTIALS.pdg.name,
    email: CREDENTIALS.pdg.email,
    phone: CREDENTIALS.pdg.phone,
    role: "pdg",
  };
}

/**
 * Récupère les demandes OTP récentes (pour la validation côté PDG).
 */
export async function fetchOtpRequests() {
  const localList = (() => {
    try {
      return JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  })();

  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from("otp_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return localList;
    return data;
  } catch {
    return localList;
  }
}

/**
 * Permet au PDG d'approuver directement une demande OTP.
 */
export async function approveOtpRequest(requestId) {
  // Mise à jour locale
  try {
    const local = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || "[]");
    const updated = local.map((r) => (r.id === requestId ? { ...r, statut: "approved" } : r));
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    //
  }

  if (supabase) {
    try {
      await supabase.from("otp_requests").update({ statut: "approved" }).eq("id", requestId);
    } catch {
      //
    }
  }

  const net = await getClientNetworkDetails();
  await logAuditEvent({
    action: "OTP_APPROUVE_PAR_PDG",
    details: `Le PDG a validé l'autorisation d'accès pour la secrétaire.`,
    user: { name: CREDENTIALS.pdg.name, role: "pdg" },
    ip: net.ip,
    location: net.location,
  });
}
