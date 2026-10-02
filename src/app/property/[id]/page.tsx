"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface PropertyDetailData {
  title: string;
  subtitle: string;
  location: string;
  lat: number;
  lng: number;
  specs: string;
  rating: string;
  reviewsCount: string;
  price: string;
  rawPrice: number;
  originalPrice?: string;
  badge: string;
  images: string[];
  host: string;
  hostExp: string;
  hostAvatar: string;
  hostType: string;
  hostReviews: string;
  hostRating: string;
  hostYears: string;
  hostLocation: string;
  cohosts: { name: string; avatar: string }[];
  description: string;
  bedrooms: { title: string; beds: string; image: string }[];
  blocked_dates?: string[];
}

export default function PropertyDetail() {
  const router = useRouter();
  const params = useParams();

  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw || "1";

  // REFERENCIA Y ESTADO PARA CARRUSEL MÓVIL
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const handleScrollCarousel = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      if (width > 0) {
        const newIndex = Math.round(scrollPosition / width);
        setCurrentSlide(newIndex);
      }
    }
  };

  // ESTADOS DE DATOS REALES DE SUPABASE
  const [realProperty, setRealProperty] = useState<any>(null);
  const [realHost, setRealHost] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ESTADOS DE FUNCIONALIDAD Y MODALES
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);
  const [showStickyNav, setShowStickyNav] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);

  // ESTADO PARA MENSAJE DE TELEGRAM
  const [messageText, setMessageText] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [reserving, setReserving] = useState<boolean>(false);

  // NUEVOS ESTADOS DE INTERACCIÓN AIRBNB
  const [showDescriptionModal, setShowDescriptionModal] = useState<boolean>(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState<boolean>(false);
  const [showPriceDetailsModal, setShowPriceDetailsModal] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // FECHAS Y HUÉSPEDES
  const [checkIn, setCheckIn] = useState<string>("2026-10-13");
  const [checkOut, setCheckOut] = useState<string>("2026-10-18");
  const [guests, setGuests] = useState<string>("6 huéspedes");

  // NAVEGACIÓN DINÁMICA DE MESES EN EL CALENDARIO
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 8, 1)); // Septiembre 2026

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // CÁLCULO DE NOCHES Y PRECIOS
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [checkIn, checkOut]);

  // REDIRECCIÓN AL DAR AL BOTÓN ATRÁS DEL NAVEGADOR
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.location.href = "https://es-l.airbnb.com/";
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // CONSULTA A SUPABASE
  useEffect(() => {
    async function fetchPropertyData() {
      if (!id) return;
      try {
        setLoading(true);
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (propError) {
          console.error("Error al obtener la propiedad:", propError);
        } else if (propData) {
          setRealProperty(propData);

          if (propData.host_id) {
            const { data: hostData } = await supabase
              .from("hosts")
              .select("*")
              .eq("id", propData.host_id)
              .maybeSingle();

            if (hostData) {
              setRealHost(hostData);
            }
          }
        }
      } catch (err) {
        console.error("Error general:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyData();
  }, [id]);

  // Mostrar sub-header al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowStickyNav(true);
      } else {
        setShowStickyNav(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const propertiesData: Record<string, PropertyDetailData> = {
    "1": {
      title: "Jarabacoa Mountain Village",
      subtitle: "Alojamiento entero: residencia en Jarabacoa, República Dominicana",
      location: "Jarabacoa, La Vega, República Dominicana",
      lat: 19.1211,
      lng: -70.6161,
      specs: "6 huéspedes · 3 habitaciones · 3 camas · 2.5 baños",
      rating: "4.9",
      reviewsCount: "116",
      price: "$1,758 USD",
      rawPrice: 1758,
      originalPrice: "$2,000 USD",
      badge: "Favorito entre huéspedes",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
      ],
      host: "Oscar",
      hostExp: "Anfitrión · 4 años en Airbnb",
      hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      hostType: "Superanfitrión",
      hostReviews: "116",
      hostRating: "4.9",
      hostYears: "4 años",
      hostLocation: "Jarabacoa, República Dominicana",
      cohosts: [
        { name: "Smerling", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
        { name: "Stephany", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
      ],
      description:
        "Descubre el lujo y confort de esta villa en Jarabacoa, ideal para grupos y familias. Rodeada de exuberante vegetación de montaña, ofrece áreas abiertas, piscina climatizada, jacuzzi y las mejores atenciones.",
      bedrooms: [
        {
          title: "Habitación 1",
          beds: "1 cama queen, 1 cama individual",
          image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600",
        },
        {
          title: "Habitación 2",
          beds: "1 cama queen",
          image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600",
        },
        {
          title: "Habitación 3",
          beds: "2 camas matrimoniales",
          image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
        },
      ],
    },
  };

  const nearbyProperties = [
    {
      id: "2",
      title: "Villa con acceso directo a la playa",
      location: "Las Terrenas, República Dominicana",
      price: "$1,850 USD",
      rating: "4.92",
      image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600",
    },
    {
      id: "3",
      title: "Penthouse de lujo con vista al mar",
      location: "Samaná, República Dominicana",
      price: "$920 USD",
      rating: "4.85",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
    },
    {
      id: "4",
      title: "Casa de campo tropical con piscina",
      location: "El Limón, República Dominicana",
      price: "$650 USD",
      rating: "4.78",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600",
    },
  ];

  const reviewTags = [
    { label: "Piscina", count: 13, icon: "🏊" },
    { label: "Hospitalidad", count: 85, icon: "🤝" },
    { label: "Vista", count: 39, icon: "🏔️" },
    { label: "Familiar", count: 26, icon: "🏡" },
    { label: "Espacios interiores", count: 18, icon: "🛋️" },
    { label: "Jacuzzi", count: 9, icon: "♨️" },
    { label: "Limpieza", count: 22, icon: "✨" },
  ];

  const userReviews = [
    {
      id: 1,
      name: "Sachin",
      location: "Princeton, Nueva Jersey",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      rating: 5,
      date: "Hace 3 semanas",
      tripType: "En grupo",
      text: "Éramos 19, todos amigos y familiares celebrando otro cumpleaños importante. La villa es hermosa y enorme, y todos estuvimos alojados muy cómodamente...",
    },
    {
      id: 2,
      name: "Braulio",
      location: "4 años en Airbnb",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      rating: 4,
      date: "julio de 2026",
      tripType: "Con niños",
      text: "Al llegar, las puertas de la propiedad estaban abiertas y tuvimos que buscar a alguien que nos ayudara. Aunque el check-in era a las 3:00 p. m., todo resultó genial...",
    },
    {
      id: 3,
      name: "Yoly",
      location: "Nueva York, Nueva York",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      rating: 5,
      date: "agosto de 2026",
      tripType: "En grupo",
      text: "El servicio fue excelente me encantó el lugar, limpio bien bonito exactamente como está en la foto servicio impecable.",
    },
    {
      id: 4,
      name: "Kenzie",
      location: "Mineápolis, Minnesota",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      rating: 5,
      date: "abril de 2026",
      tripType: "Con niños",
      text: "Recibimos a nuestra numerosa familia durante 4 días y todo salió a la perfección.",
    },
  ];

  const defaultProperty = propertiesData[id] || propertiesData["1"];

  const rawPriceVal = realProperty?.price
    ? parseFloat(String(realProperty.price).replace(/[^0-9.]/g, "")) || 0
    : defaultProperty.rawPrice;

  const property: PropertyDetailData = realProperty
    ? {
        title: realProperty.title || defaultProperty.title,
        subtitle: `Alojamiento entero: residencia en ${realProperty.location_name || realProperty.location || "República Dominicana"}`,
        location: realProperty.location_name || realProperty.location || defaultProperty.location,
        lat: realProperty.latitude || realProperty.lat || defaultProperty.lat,
        lng: realProperty.longitude || realProperty.lng || defaultProperty.lng,
        specs: `${realProperty.guests_max || realProperty.guests || 6} huéspedes · ${realProperty.bedrooms || 3} habitaciones · ${realProperty.beds || 3} camas · ${realProperty.bathrooms || 2.5} baños`,
        rating: realProperty.rating ? String(realProperty.rating) : defaultProperty.rating,
        reviewsCount: defaultProperty.reviewsCount,
        price: `$${rawPriceVal.toLocaleString("en-US")} USD`,
        rawPrice: rawPriceVal,
        originalPrice: defaultProperty.originalPrice,
        badge: defaultProperty.badge,
        images: realProperty.images && realProperty.images.length > 0
          ? realProperty.images
          : realProperty.image_url
          ? [realProperty.image_url]
          : defaultProperty.images,
        host: realHost?.name || defaultProperty.host,
        hostExp: realHost?.experience || defaultProperty.hostExp,
        hostAvatar: realHost?.photo || defaultProperty.hostAvatar,
        hostType: "Superanfitrión",
        hostReviews: defaultProperty.reviewsCount,
        hostRating: realHost?.rating ? String(realHost.rating) : defaultProperty.rating,
        hostYears: defaultProperty.hostYears,
        hostLocation: "República Dominicana",
        cohosts: defaultProperty.cohosts,
        description: realProperty.description || defaultProperty.description,
        bedrooms: defaultProperty.bedrooms,
        blocked_dates: realProperty.blocked_dates || [],
      }
    : defaultProperty;

  // CONJUNTOS DE FECHAS BLOQUEADAS
  const disabledDatesSet = useMemo(() => {
    const set = new Set<string>();
    const rawBlocked = property.blocked_dates || [];

    rawBlocked.forEach((item) => {
      if (item.includes(" al ")) {
        const [startStr, endStr] = item.split(" al ").map((s) => s.trim());
        let curr = new Date(startStr);
        const last = new Date(endStr);
        while (curr <= last) {
          set.add(curr.toISOString().split("T")[0]);
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        set.add(item.trim());
      }
    });

    return set;
  }, [property.blocked_dates]);

  // CÁLCULO DE TOTAL DE LA RESERVA
  const totalPriceFormatted = useMemo(() => {
    const total = property.rawPrice * (nightsCount > 0 ? nightsCount : 1);
    return `$${total.toLocaleString("en-US")} USD`;
  }, [property.rawPrice, nightsCount]);

  // MANEJO DE ENVÍO DE MENSAJE A TELEGRAM
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSendingMessage(true);

    try {
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.error("Faltan las credenciales de Telegram en las variables de entorno.");
        alert("Error de configuración al enviar el mensaje.");
        setSendingMessage(false);
        return;
      }

      const captionText = `<b>📩 Nuevo mensaje para el anfitrión</b>\n\n` +
        `<b>Propiedad:</b> ${property.title}\n` +
        `<b>Anfitrión:</b> ${property.host}\n` +
        `<b>Llegada:</b> ${checkIn}\n` +
        `<b>Salida:</b> ${checkOut}\n` +
        `<b>Huéspedes:</b> ${guests}\n\n` +
        `<b>Mensaje del cliente:</b>\n${messageText}`;

      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("photo", property.images[0] || property.hostAvatar);
      formData.append("caption", captionText);
      formData.append("parse_mode", "HTML");

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.ok) {
        alert("¡Mensaje enviado al anfitrión con éxito!");
        setMessageText("");
        setShowMessageModal(false);
      } else {
        console.error("Error devuelto por la API de Telegram:", result);
        alert("Hubo un fallo al enviar el mensaje por Telegram.");
      }
    } catch (err) {
      console.error("Error al conectar con la API de Telegram:", err);
      alert("Ocurrió un error al intentar enviar el mensaje.");
    } finally {
      setSendingMessage(false);
    }
  };

  // MANEJO DE CLIC EN DÍAS DEL CALENDARIO
  const handleDateClick = (dateStr: string) => {
    if (disabledDatesSet.has(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut("");
    } else if (dateStr > checkIn) {
      setCheckOut(dateStr);
    } else {
      setCheckIn(dateStr);
      setCheckOut("");
    }
  };

  // ENVIAR SOLICITUD DE RESERVA A TELEGRAM Y REDIRIGIR
  const handleReserve = async () => {
    if (reserving) return;
    setReserving(true);

    try {
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const captionText = `<b>🚨 ¡NUEVA SOLICITUD DE RESERVA!</b>\n\n` +
          `<b>Propiedad:</b> ${property.title}\n` +
          `<b>Llegada:</b> ${checkIn || "No seleccionada"}\n` +
          `<b>Salida:</b> ${checkOut || "No seleccionada"}\n` +
          `<b>Noches:</b> ${nightsCount}\n` +
          `<b>Huéspedes:</b> ${guests}\n` +
          `<b>Total Estimado:</b> ${totalPriceFormatted}\n\n` +
          `<b>Ubicación:</b> ${property.location}`;

        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("photo", property.images[0] || property.hostAvatar);
        formData.append("caption", captionText);
        formData.append("parse_mode", "HTML");

        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          body: formData,
        });
      }
    } catch (error) {
      console.error("Error enviando notificación a Telegram al reservar:", error);
    } finally {
      setReserving(false);
      router.push(`/book/stays?id=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(guests)}`);
    }
  };

  // REDIRIGIR A AIRBNB OFICIAL
  const handleRedirectToAirbnb = () => {
    window.location.href = "https://es-l.airbnb.com/";
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  const scrollToSection = (idStr: string) => {
    const el = document.getElementById(idStr);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // GENERAR MES PARA EL CALENDARIO
  const renderMonth = (monthOffset: number) => {
    const targetDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + monthOffset, 1);
    const monthName = targetDate.toLocaleString("es-ES", { month: "long" });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const year = targetDate.getFullYear();

    const daysInMonth = new Date(year, targetDate.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, targetDate.getMonth(), 1).getDay() + 6) % 7; // Ajustar Lunes=0

    return (
      <div className="w-full">
        <h4 className="text-center font-semibold text-sm mb-4">
          {capitalizedMonth} {year}
        </h4>
        <div className="grid grid-cols-7 text-center font-bold text-xs text-gray-400 mb-2">
          <span>L</span><span>Ma</span><span>Mi</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <span key={`empty-${i}`}></span>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const m = targetDate.getMonth() + 1;
            const dateStr = `${year}-${m < 10 ? "0" + m : m}-${day < 10 ? "0" + day : day}`;
            const isBlocked = disabledDatesSet.has(dateStr);
            const isSelected = dateStr === checkIn || dateStr === checkOut;
            const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

            return (
              <button
                key={dateStr}
                disabled={isBlocked}
                onClick={() => handleDateClick(dateStr)}
                className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center font-medium transition ${
                  isBlocked
                    ? "text-gray-300 line-through cursor-not-allowed"
                    : isSelected
                    ? "bg-black text-white"
                    : isInRange
                    ? "bg-gray-100 text-black rounded-none w-full"
                    : "hover:border border-black"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Cargando publicación...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#FF385C] selection:text-white relative pb-28 lg:pb-0">
      {/* NOTIFICACIÓN AL COPIAR ENLACE */}
      {showShareToast && (
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl transition-all flex items-center gap-2">
          <span>🔗</span> ¡Enlace copiado al portapapeles!
        </div>
      )}

      {/* MODAL DE DETALLES DE PRECIO Y DESGLOSE (ESTILO AIRBNB) */}
      {showPriceDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <button
              onClick={() => setShowPriceDetailsModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full font-bold text-gray-500 transition"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold mb-4 border-b border-gray-100 pb-3 text-gray-900">
              Información del precio
            </h3>

            <div className="space-y-4 text-sm text-gray-800">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Fechas seleccionadas</span>
                <button 
                  onClick={() => {
                    setShowPriceDetailsModal(false);
                    scrollToSection("calendario");
                  }}
                  className="font-semibold text-black underline hover:text-gray-600 transition"
                >
                  Cambiar
                </button>
              </div>

              <div className="space-y-3 py-2">
                <div className="flex justify-between items-center text-sm">
                  <span>{property.price} × {nightsCount > 0 ? nightsCount : 1} noche{nightsCount > 1 ? "s" : ""}</span>
                  <span className="font-medium">{totalPriceFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Tarifa por servicio de Airbnb</span>
                  <span>$0.00 USD</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Impuestos incluidos</span>
                  <span>$0.00 USD</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center font-bold text-base text-black">
                <span>Total estimado</span>
                <span>{totalPriceFormatted}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 mt-4 flex items-center gap-2">
                <span>✓</span>
                <span><strong>Cancelación gratuita</strong> disponible para las fechas seleccionadas.</span>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setShowPriceDetailsModal(false);
                    handleReserve();
                  }}
                  disabled={reserving}
                  className="w-full bg-gradient-to-r from-[#E81948] via-[#E31C5F] to-[#D70466] hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  {reserving ? "Procesando..." : "Reservar ahora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESCRIPCIÓN COMPLETA */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowDescriptionModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full font-bold text-gray-500"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-4">Acerca de este espacio</h3>
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE SERVICIOS / AMENIDADES COMPLETO */}
      {showAmenitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowAmenitiesModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full font-bold text-gray-500"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-6">Lo que este lugar ofrece</h3>

            <div className="space-y-6 text-sm text-gray-800">
              <div>
                <h4 className="font-semibold text-base mb-3">Vistas panorámicas</h4>
                <div className="py-2 border-b border-gray-100 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span>Vista a la montaña y al jardín</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-3">Baño</h4>
                <div className="py-2 border-b border-gray-100 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Agua caliente y secador de pelo</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-3">Servicios no incluidos</h4>
                <div className="py-2 border-b border-gray-100 flex items-center gap-3 line-through text-gray-400">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Detector de monóxido de carbono</span>
                </div>
                <div className="py-2 border-b border-gray-100 flex items-center gap-3 line-through text-gray-400">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Detector de humo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MENSAJE AL ANFITRIÓN CON INTEGRACIÓN A TELEGRAM */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowMessageModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full font-bold text-gray-500"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">Escríbele a {property.host}</h3>
            <form onSubmit={handleMessageSubmit}>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Hola ${property.host}, quisiera consultar sobre la disponibilidad...`}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4"
                required
              ></textarea>
              <button
                type="submit"
                disabled={sendingMessage}
                className="w-full bg-[#FF385C] hover:bg-[#e00b41] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {sendingMessage ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE GALERÍA DE FOTOS COMPLETA */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-6 md:p-12">
          <div className="max-w-[850px] mx-auto">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md py-4 flex justify-between items-center border-b border-gray-100 mb-8">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full font-bold text-lg"
              >
                ✕
              </button>
              <span className="font-semibold text-sm">
                Todas las fotos ({property.images.length})
              </span>
              <div className="w-8"></div>
            </div>

            <div className="space-y-6">
              {property.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-auto rounded-xl object-cover shadow-sm hover:opacity-95 transition"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL (DESKTOP SOLO) */}
      <header className="hidden md:flex sticky top-0 z-40 bg-white border-b border-gray-200 px-6 sm:px-10 py-4 items-center justify-between max-w-[1280px] mx-auto w-full">
        <div
          onClick={handleRedirectToAirbnb}
          className="cursor-pointer flex items-center gap-2"
        >
          <img
            src="/logo1.png"
            alt="Logo"
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Buscador central */}
        <div
          onClick={handleRedirectToAirbnb}
          className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer bg-white gap-3 text-xs font-medium"
        >
          <span className="px-2 border-r border-gray-200 font-semibold text-gray-800">
            En cualquier lugar del mundo
          </span>
          <span className="px-2 border-r border-gray-200 font-semibold text-gray-800">
            Cualquier fecha
          </span>
          <span className="text-gray-400 px-1 font-normal">¿Cuántos?</span>
          <div className="bg-[#FF385C] text-white p-2 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-3">
          <button className="hidden lg:block text-xs font-semibold hover:bg-gray-100 py-2.5 px-3.5 rounded-full transition text-gray-800">
            Conviértete en anfitrión
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-700">🌐</button>
          <div className="flex items-center gap-2 border border-gray-300 rounded-full py-1.5 px-3 hover:shadow-md transition cursor-pointer">
            <span className="text-sm">☰</span>
            <div className="w-7 h-7 bg-gray-500 rounded-full text-white flex items-center justify-center text-xs font-bold">
              👤
            </div>
          </div>
        </div>
      </header>

      {/* SUB-HEADER PEGAJOSO (AL HACER SCROLL) */}
      {showStickyNav && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 transition-all duration-200 hidden md:block shadow-sm">
          <div className="max-w-[1120px] mx-auto px-6 -mt-6 rounded-t-[32px] bg-white relative z-10 pt-6 md:mt-0 md:pt-0">
            <div className="flex justify-between items-center">
              <div className="flex gap-8 text-sm font-semibold text-gray-800">
                <button onClick={() => scrollToSection("fotos")} className="py-7 border-b-2 border-black">
                  Fotos
                </button>
                <button
                  onClick={() => scrollToSection("servicios")}
                  className="py-7 hover:border-b-2 hover:border-black text-gray-600"
                >
                  Servicios
                </button>
                <button
                  onClick={() => scrollToSection("resenas")}
                  className="py-7 hover:border-b-2 hover:border-black text-gray-600"
                >
                  Reseñas
                </button>
                <button
                  onClick={() => scrollToSection("ubicacion")}
                  className="py-7 hover:border-b-2 hover:border-black text-gray-600"
                >
                  Ubicación
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-bold text-base">{totalPriceFormatted}</span>
                  <span className="text-xs text-gray-600"> {nightsCount > 0 ? `por ${nightsCount} noche${nightsCount > 1 ? "s" : ""}` : "por noche"}</span>
                  <div className="text-[11px] text-gray-700 font-medium">
                    ★ {property.rating} · {property.reviewsCount} reseñas
                  </div>
                </div>
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="bg-[#FF385C] hover:bg-[#e00b41] text-white font-semibold text-sm px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {reserving ? "Procesando..." : "Reserva"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GALERÍA COLLAGE / CARRUSEL MÓVIL DESLIZABLE */}
      <div
        id="fotos"
        className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] md:max-w-[1120px] md:mx-auto md:px-6 md:pt-6 md:rounded-2xl overflow-hidden"
      >
        {/* MÓVIL: BOTONES FLOTANTES SUPERIORES SOBRE LA FOTO CON EL ESTILO OFICIAL AIRBNB */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-auto">
          <button
            onClick={() => handleRedirectToAirbnb()}
            className="w-9 h-9 bg-[#222222]/30 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition"
            aria-label="Regresar"
          >
            <svg viewBox="0 0 32 32" className="w-4 h-4 fill-none stroke-current stroke-[3px]">
              <path d="M20 28L8 16 20 4" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-9 h-9 bg-[#222222]/30 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition"
              aria-label="Compartir"
            >
              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-none stroke-current stroke-[2.5px]">
                <path d="M24 12v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V12m8-8v16m-6-10l6-6 6 6" />
              </svg>
            </button>
            <button
              onClick={handleToggleSave}
              className="w-9 h-9 bg-[#222222]/30 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition"
              aria-label="Guardar"
            >
              <svg 
                viewBox="0 0 32 32" 
                className={`w-4 h-4 stroke-current stroke-[2.5px] ${isSaved ? "fill-[#FF385C] stroke-[#FF385C]" : "fill-none text-white"}`}
              >
                <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.83-4.84 2.13L16 8.35l-2.16-2.22A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
              </svg>
            </button>
          </div>
        </div>

        {/* CARRUSEL MÓVIL INTERACTIVO DESLIZABLE CON EL DEDO */}
        <div
          ref={carouselRef}
          onScroll={handleScrollCarousel}
          className="md:hidden flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {property.images.map((img, idx) => (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 snap-start relative cursor-pointer"
              onClick={() => setShowGalleryModal(true)}
            >
              <img
                src={img}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* CONTADOR EN MÓVIL */}
        <div className="md:hidden absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md z-10 pointer-events-none">
          {currentSlide + 1} / {property.images.length}
        </div>

        {/* DESKTOP: Grilla de 4 columnas */}
        <div className="hidden md:grid grid-cols-4 gap-2 h-full rounded-2xl overflow-hidden">
          <div className="col-span-2 h-full cursor-pointer" onClick={() => setShowGalleryModal(true)}>
            <img
              src={property.images[0]}
              alt="Principal"
              className="w-full h-full object-cover hover:brightness-95 transition"
            />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
            {property.images.slice(1, 5).map((img, i) => (
              <div key={i} className="h-[206px] cursor-pointer" onClick={() => setShowGalleryModal(true)}>
                <img
                  src={img}
                  alt={`Vista ${i}`}
                  className="w-full h-full object-cover hover:brightness-95 transition"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowGalleryModal(true)}
          className="hidden md:flex absolute bottom-8 right-10 bg-white/90 backdrop-blur-md border border-black text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-white transition items-center gap-2"
        >
          <span>⊞</span> Mostrar todas las fotos
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-[1120px] mx-auto px-6 -mt-6 rounded-t-[32px] bg-white relative z-10 pt-6 md:mt-0 md:pt-0">
        {/* TITULO Y ACCIONES DESKTOP */}
        <div className="hidden md:flex justify-between items-start mb-4">
          <h1 className="text-2xl sm:text-[26px] font-semibold text-[#222222] tracking-tight">
            {property.title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              <span>⇧</span> <u>Compartir</u>
            </button>
            <button
              onClick={handleToggleSave}
              className="flex items-center gap-1.5 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              <span className={isSaved ? "text-[#FF385C]" : ""}>{isSaved ? "❤️" : "♡"}</span>
              <u>{isSaved ? "Guardado" : "Guardar"}</u>
            </button>
          </div>
        </div>

        {/* GRID DE DETALLES Y TARJETA FLOTANTE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-8">
            {/* SECCIÓN MÓVIL EXACTA AIRBNB */}
            <div className="border-b border-gray-200 pb-6 text-center md:text-left">
              <h1 className="text-2xl font-bold text-[#222222] leading-tight mb-4">
                {property.title}
              </h1>
              <p className="text-gray-500 text-sm md:text-base font-normal">
                {property.subtitle}
              </p>
              <p className="text-gray-500 text-sm md:text-base font-normal mt-1">
                {property.specs}
              </p>
            </div>

            {/* BLOQUE TARJETA DESTACADA "FAVORITO ENTRE HUÉSPEDES" CORREGIDO */}
            <div className="border border-gray-200 rounded-2xl p-4 my-6 shadow-xs">
              <div className="flex items-center justify-between sm:justify-center sm:gap-8">
                {/* Puntuación */}
                <div className="flex flex-col items-center px-2 sm:px-3">
                  <span className="text-lg font-extrabold text-[#222222]">{property.rating}</span>
                  <div className="text-xs text-black">★★★★★</div>
                </div>

                <div className="h-10 w-[1px] bg-gray-200"></div>

                {/* Ramitas de Laurel agrupadas con su texto central */}
                <div className="favorito-container flex items-center justify-center gap-2 px-1">
                  <img
                    src="/izquierda.png"
                    alt="Ramita Izquierda"
                    className="rama rama-izquierda h-10 w-auto object-contain"
                  />
                  <div className="texto-favorito text-xs sm:text-sm font-extrabold text-[#222222] text-center leading-tight max-w-[110px]">
                    Favorito<br />entre<br />huéspedes
                  </div>
                  <img
                    src="/derecha1.png"
                    alt="Ramita Derecha"
                    className="rama rama-derecha h-10 w-auto object-contain"
                  />
                </div>

                <div className="h-10 w-[1px] bg-gray-200"></div>

                {/* Evaluaciones */}
                <div className="evaluaciones-container flex flex-col items-center px-2 sm:px-3">
                  <span className="numero text-lg font-extrabold text-[#222222]">{property.reviewsCount}</span>
                  <span className="label text-[11px] text-gray-500 underline font-medium">Evaluaciones</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-md font-medium">
                  Cancelación gratuita
                </span>
              </div>
            </div>

            {/* ANFITRIÓN RESUMEN ESTILO AIRBNB */}
            <div className="border-b border-gray-200 pb-6 flex items-center gap-4">
              <img
                src={property.hostAvatar}
                alt={property.host}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-base text-gray-900">
                  Anfitrión: {property.host}
                </h4>
                <p className="text-xs text-gray-500">{property.hostExp}</p>
              </div>
            </div>

            {/* LOGROS DEL ALOJAMIENTO */}
            <div className="border-b border-gray-200 pb-6 space-y-6 my-6">
              {/* Trofeo */}
              <div className="flex items-start gap-4">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    En el 10% de los alojamientos mejor calificados
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Este alojamiento está entre los mejores en Airbnb, según las calificaciones, evaluaciones y confiabilidad.
                  </p>
                </div>
              </div>

              {/* Alberca */}
              <div className="flex items-start gap-4">
                <span className="text-2xl">🏊</span>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Disfruta la alberca y el jacuzzi
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    En este alojamiento puedes nadar o darte un chapuzón.
                  </p>
                </div>
              </div>

              {/* Clima */}
              <div className="flex items-start gap-4">
                <span className="text-2xl">❄️</span>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Diseñado para garantizar el fresquito
                  </h4>
                </div>
              </div>
            </div>

            {/* HIGHLIGHTS DESTACADOS */}
            <div className="border-b border-gray-200 pb-6 space-y-4">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-gray-800 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">Llegada autónoma</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Realiza el check-in fácilmente con la caja de seguridad para llaves.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-gray-800 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{property.host} es Superanfitrión</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Los Superanfitriones son anfitriones con experiencia y evaluaciones excelentes.
                  </p>
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN CON RECORTE Y "MOSTRAR MÁS" */}
            <div className="border-b border-gray-200 pb-8">
              <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">
                {property.description}
              </p>
              <button
                onClick={() => setShowDescriptionModal(true)}
                className="mt-3 font-semibold text-sm text-black underline flex items-center gap-1 hover:opacity-80 transition"
              >
                Mostrar más &gt;
              </button>
            </div>

            {/* ¿DÓNDE VAS A DORMIR? */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold mb-6">¿Dónde vas a dormir?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.bedrooms.map((bed, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl overflow-hidden p-4 space-y-3 hover:shadow-md transition"
                  >
                    <img
                      src={bed.image}
                      alt={bed.title}
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-semibold text-sm">{bed.title}</h4>
                      <p className="text-xs text-gray-500">{bed.beds}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SERVICIOS / AMENIDADES CON ICONOS SVG Y BOTÓN MODAL */}
            <div id="servicios" className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold mb-6">Lo que este lugar ofrece</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-800 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span>Cocina</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M2.828 9.9a15 15 0 0121.214 0" /></svg>
                  <span>Wifi</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                  <span>Estacionamiento gratuito en las instalaciones</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <span>Piscina privada</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span>Cámaras de seguridad exteriores</span>
                </div>
                <div className="flex items-center gap-3 line-through text-gray-400">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  <span>Detector de monóxido de carbono</span>
                </div>
              </div>

              <button
                onClick={() => setShowAmenitiesModal(true)}
                className="px-6 py-3 border border-black rounded-xl font-semibold text-sm hover:bg-gray-100 transition"
              >
                Mostrar los 32 servicios
              </button>
            </div>

            {/* SECCIÓN CALENDARIO INTERACTIVO EN PÁGINA (DINÁMICO ESTILO AIRBNB REAL) */}
            <div id="calendario" className="border-b border-gray-200 pb-8 scroll-mt-20">
              <h3 className="text-xl font-semibold mb-1">
                {nightsCount > 0 
                  ? `${nightsCount} noche${nightsCount > 1 ? "s" : ""} en ${property.location.split(',')[0]}` 
                  : "Selecciona la fecha de llegada"}
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                {checkIn && checkOut ? `${checkIn} - ${checkOut}` : "Añade tus fechas de viaje para ver precios exactos"}
              </p>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm relative">
                {/* BOTONES DE NAVEGACIÓN DE MESES */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition"
                    aria-label="Mes anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition"
                    aria-label="Mes siguiente"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* PRIMER MES VISIBLE */}
                  {renderMonth(0)}

                  {/* SEGUNDO MES VISIBLE (DESKTOP SOLO) */}
                  <div className="hidden md:block">
                    {renderMonth(1)}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-xs">⌨️</button>
                  <button
                    onClick={() => {
                      setCheckIn("");
                      setCheckOut("");
                    }}
                    className="text-xs font-semibold text-black underline hover:opacity-80"
                  >
                    Borrar fechas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TARJETA DE RESERVA FLOTANTE DESKTOP (OCULTA EN MÓVIL) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 border border-gray-200 shadow-xl rounded-2xl p-6 bg-white space-y-5">
              <div className="bg-pink-50 border border-pink-100 p-2.5 rounded-xl flex items-center gap-2 text-xs text-gray-800">
                <span>📍</span>
                <span>Los precios incluyen todas las tarifas</span>
              </div>

              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{property.price}</span>
                  <span className="text-gray-600 text-xs font-normal"> / noche</span>
                </div>
              </div>

              {/* FORMULARIO DE FECHAS ESTILO AIRBNB */}
              <div className="border border-gray-400 rounded-xl overflow-hidden text-xs cursor-pointer">
                <div className="grid grid-cols-2 border-b border-gray-400">
                  <div className="p-2.5 border-r border-gray-400">
                    <label className="block font-extrabold text-[9px] text-gray-800">
                      LLEGADA
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent font-normal text-gray-800 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="p-2.5">
                    <label className="block font-extrabold text-[9px] text-gray-800">
                      SALIDA
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent font-normal text-gray-800 outline-none cursor-pointer"
                    />
                  </div>
                </div>
                <div className="p-2.5">
                  <label className="block font-extrabold text-[9px] text-gray-800">
                    HUÉSPEDES
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-transparent font-normal text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="1 huéspedes">1 huésped</option>
                    <option value="2 huéspedes">2 huéspedes</option>
                    <option value="4 huéspedes">4 huéspedes</option>
                    <option value="6 huéspedes">6 huéspedes</option>
                    <option value="16 huéspedes">16 huéspedes</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleReserve}
                disabled={reserving}
                className="w-full bg-gradient-to-r from-[#E81948] via-[#E31C5F] to-[#D70466] hover:opacity-95 text-white font-semibold py-3.5 rounded-xl transition text-base shadow-sm active:scale-95 disabled:opacity-50"
              >
                {reserving ? "Procesando..." : "Reserva"}
              </button>

              <p className="text-center text-xs text-gray-500">
                No se hará ningún cargo por el momento
              </p>

              {/* DESGLOSE DE PRECIO CALCULADO */}
              {nightsCount > 0 && (
                <div className="border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <u className="text-gray-600">{property.price} x {nightsCount} noche{nightsCount > 1 ? "s" : ""}</u>
                    <span>{totalPriceFormatted}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black border-t border-gray-200 pt-3 text-base">
                    <span>Total antes de impuestos</span>
                    <span>{totalPriceFormatted}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN RESEÑAS Y CALIFICACIONES DETALLADAS */}
        <div id="resenas" className="border-t border-gray-200 mt-12 pt-12">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            ★ {property.rating} · {property.reviewsCount} reseñas
          </h2>
          <u className="text-xs font-semibold text-gray-600 block mb-8 cursor-pointer">
            ¿Cómo funcionan las reseñas?
          </u>

          {/* DESGLOSE GENERAL CON ICONOS Y BARRAS */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-10 text-xs text-gray-800 border-b border-gray-200 pb-8 items-end">
            <div className="pr-4 border-r border-gray-200 col-span-2 md:col-span-1">
              <p className="font-semibold mb-2">Valoración general</p>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((num) => (
                  <div key={num} className="flex items-center gap-2 text-[10px]">
                    <span>{num}</span>
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-black h-full" style={{ width: num === 5 ? "90%" : num === 4 ? "10%" : "0%" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pr-4 border-r border-gray-200">
              <p className="font-semibold">Limpieza</p>
              <p className="text-base font-bold my-1">4.9</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.022.547l-1.02 1.02a2 2 0 000 2.828l1.02 1.02a2 2 0 002.828 0l1.02-1.02a2 2 0 00.547-1.022l.477-2.387a6 6 0 01.517-3.86l.158-.318a6 6 0 00.517-3.86l-.477-2.387a2 2 0 00-.547-1.022l-1.02-1.02a2 2 0 00-2.828 0l-1.02 1.02a2 2 0 000 2.828l1.02 1.02z" /></svg>
            </div>

            <div className="pr-4 border-r border-gray-200">
              <p className="font-semibold">Exactitud</p>
              <p className="text-base font-bold my-1">4.9</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>

            <div className="pr-4 border-r border-gray-200">
              <p className="font-semibold">Check-in</p>
              <p className="text-base font-bold my-1">4.9</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>

            <div className="pr-4 border-r border-gray-200">
              <p className="font-semibold">Comunicación</p>
              <p className="text-base font-bold my-1">5.0</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>

            <div className="pr-4 border-r border-gray-200">
              <p className="font-semibold">Ubicación</p>
              <p className="text-base font-bold my-1">4.9</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>

            <div>
              <p className="font-semibold">Precio</p>
              <p className="text-base font-bold my-1">4.8</p>
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            </div>
          </div>

          {/* FILTROS POR MENCIONES / PALABRAS CLAVE */}
          <div className="mb-8">
            <h3 className="font-semibold text-base mb-4">Las reseñas de los huéspedes mencionan</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {reviewTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTag(selectedTag === tag.label ? null : tag.label)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                    selectedTag === tag.label
                      ? "border-black bg-gray-100"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                  <span className="text-gray-400">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GRID DE RESEÑAS 2 COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {userReviews.map((rev) => (
              <div key={rev.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm">{rev.name}</h4>
                    <p className="text-xs text-gray-500">{rev.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex text-black">
                    {"★".repeat(rev.rating)}
                  </div>
                  <span className="text-gray-500">· {rev.date}</span>
                  <span className="text-gray-500">· {rev.tripType}</span>
                </div>

                <p className="text-xs text-gray-800 leading-relaxed">
                  {rev.text}
                </p>

                <button className="font-semibold text-xs text-black underline hover:opacity-80">
                  Mostrar más
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MAPA INTERACTIVO CON DISEÑO ESTILIZADO AIRBNB */}
        <div id="ubicacion" className="border-t border-gray-200 mt-12 pt-12">
          <h2 className="text-xl font-semibold mb-2">A dónde irás</h2>
          <p className="text-sm text-gray-600 mb-6">{property.location}</p>

          <div className="w-full h-[350px] sm:h-[450px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative group">
            <div className="absolute top-4 left-4 z-10 bg-white shadow-md rounded-full px-4 py-2 flex items-center gap-2 border border-gray-100 text-xs text-gray-700 w-64 sm:w-72">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="truncate font-medium">Encuentra transporte público</span>
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition font-bold text-lg">
                ✕
              </button>
              <div className="flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold border-b border-gray-100 text-lg">
                  +
                </button>
                <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 font-bold text-lg">
                  −
                </button>
              </div>
              <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-xl hover:bg-gray-50 transition">
                🧍
              </button>
            </div>

            <iframe
              title="Google Maps AirBnb Style"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${property.lat},${property.lng}&z=13&output=embed`}
              className="w-full h-full filter brightness-105 contrast-[0.92] saturate-[0.85]"
            ></iframe>
          </div>

          <div className="mt-3 text-right">
            <a
              href={`https://maps.google.com/maps?q=${property.lat},${property.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 underline font-medium hover:text-black"
            >
              Ver mapa completo
            </a>
          </div>
        </div>

        {/* SECCIÓN CONOCE A TU ANFITRÓN */}
        <div className="border-t border-gray-200 mt-12 pt-12 pb-12">
          <h2 className="text-[22px] font-semibold text-[#222222] mb-8">
            Conoce a tu anfitrión
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 bg-white border border-gray-200 rounded-[24px] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] flex flex-col items-center text-center max-w-[380px] mx-auto md:mx-0">
              <div className="relative mb-4">
                <img
                  src={property.hostAvatar}
                  alt={property.host}
                  className="w-28 h-28 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-1 bg-[#FF385C] text-white p-2 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    role="presentation"
                    focusable="false"
                    className="w-3.5 h-3.5 fill-current"
                  >
                    <path d="M13.82 4.06a1.25 1.25 0 0 1 .18 1.7L9.5 12.06a1.25 1.25 0 0 1-1.8.18L2.18 7.76a1.25 1.25 0 0 1 1.7-1.8l4.63 3.7 3.61-5.42a1.25 1.25 0 0 1 1.7-.18z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-[#222222]">{property.host}</h3>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                Empecé a anfitrionar en 2022
              </p>

              <div className="w-full grid grid-cols-3 border-t border-b border-gray-100 py-4 my-6 text-center">
                <div>
                  <p className="font-extrabold text-xl text-[#222222]">{property.hostReviews}</p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">
                    Reseñas
                  </p>
                </div>
                <div className="border-x border-gray-100">
                  <p className="font-extrabold text-xl text-[#222222]">★ {property.hostRating}</p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">
                    Calificación
                  </p>
                </div>
                <div>
                  <p className="font-extrabold text-xl text-[#222222]">{property.hostYears}</p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-0.5">
                    Anfitrionando
                  </p>
                </div>
              </div>

              <div className="w-full text-left flex items-center gap-2.5 text-xs text-gray-800 font-medium">
                <span className="text-base">🌐</span>
                <span>Vive en {property.hostLocation}</span>
              </div>
            </div>

            <div className="md:col-span-7 space-y-6 md:pl-6">
              <div>
                <h4 className="font-semibold text-base text-[#222222] mb-4">Coanfitriones</h4>
                <div className="flex flex-wrap items-center gap-6">
                  {property.cohosts.map((co, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={co.avatar}
                        alt={co.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-sm font-medium text-[#222222]">{co.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="bg-[#F7F7F7] hover:bg-[#EBEBEB] text-[#222222] font-semibold text-sm px-6 py-3.5 rounded-xl border border-black transition duration-200 shadow-none w-full sm:w-auto"
                >
                  Mensajea con el anfitrión
                </button>
              </div>

              <div className="pt-4 flex items-start gap-3 max-w-lg">
                <div className="text-[#FF385C] mt-0.5">
                  <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
                    <path d="M16 1a15 15 0 1 0 15 15A15 15 0 0 0 16 1zm0 28a13 13 0 1 1 13-13 13 13 0 0 1-13 13zm-1-19h2v8h-2zm0 10h2v2h-2z" />
                  </svg>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Para proteger tus pagos, usa siempre Airbnb a la hora de transferir dinero y comunicarte con los anfitriones.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LO QUE DEBES SABER */}
        <div className="border-t border-gray-200 mt-8 pt-12 pb-12">
          <h2 className="text-xl font-semibold mb-6">Lo que debes saber</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Política de cancelación</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cancela antes del check-in para obtener un reembolso parcial o total. Consulta la política completa del anfitrión para conocer todos los detalles.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Reglas de la casa</h4>
              <p className="text-xs text-gray-600 leading-relaxed">Check-in: 3:00 p.m. - 8:00 p.m.</p>
              <p className="text-xs text-gray-600 leading-relaxed">Salida antes de las 11:00 a.m.</p>
              <p className="text-xs text-gray-600 leading-relaxed">Máximo 6 huéspedes</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Seguridad y propiedad</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cámaras de seguridad en las áreas exteriores comunes.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">Detector de humo instalado.</p>
              <p className="text-xs text-gray-600 leading-relaxed">Detector de monóxido de carbono.</p>
            </div>
          </div>
        </div>

        {/* MÁS ALOJAMIENTOS CERCANOS */}
        <div className="border-t border-gray-200 pt-12 pb-12">
          <h2 className="text-xl font-semibold mb-6">Más alojamientos cerca de esta zona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {nearbyProperties.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/property/${item.id}`)}
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="flex justify-between items-start text-sm">
                  <h3 className="font-bold text-gray-900 truncate pr-2">{item.title}</h3>
                  <span className="font-medium flex items-center gap-1 text-xs">
                    ★ {item.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{item.location}</p>
                <p className="text-sm font-semibold mt-1 text-gray-900">{item.price} <span className="font-normal text-xs text-gray-600">noche</span></p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BARRA FLOTANTE INFERIOR DE RESERVA EN MÓVIL EXACTA A AIRBNB */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        {/* ANUNCIO / AVISO DE OPORTUNIDAD ÚNICA */}
        <div className="bg-[#EBEBEB] py-1.5 px-4 text-center text-[11px] font-medium text-[#222222] border-b border-gray-300 flex items-center justify-center gap-1.5">
          <span>💎</span>
          <span>¡Oportunidad única! Este lugar suele estar reservado.</span>
        </div>

        {/* CONTENEDOR DE PRECIO Y BOTÓN DE RESERVA */}
        <div className="px-5 py-3 flex items-center justify-between">
          {/* HACIENDO CLIC AQUÍ ABRE EL MODAL DE DETALLES DE PRECIO */}
          <div 
            onClick={() => setShowPriceDetailsModal(true)}
            className="cursor-pointer group active:opacity-70 transition"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 underline group-hover:text-black">
                {property.price}
              </span>
            </div>
            <p className="text-[11px] text-gray-700 font-normal">
              {checkIn && checkOut 
                ? `Por ${nightsCount} noche${nightsCount > 1 ? "s" : ""} · ${checkIn.split("-")[2]}–${checkOut.split("-")[2]} de oct`
                : "Selecciona las fechas"}
            </p>
          </div>

          <button
            onClick={handleReserve}
            disabled={reserving}
            className="bg-gradient-to-r from-[#E81948] via-[#E31C5F] to-[#D70466] hover:opacity-95 text-white font-bold text-base px-8 py-3 rounded-2xl transition shadow-md active:scale-95 disabled:opacity-50"
          >
            {reserving ? "Procesando..." : "Reservar"}
          </button>
        </div>
      </div>
    </main>
  );
}