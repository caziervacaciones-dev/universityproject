"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export interface Property {
  id: string | number;
  title: string;
  location: string;
  rating: string;
  price: string;
  image: string;
  badge: string;
  host_info?: {
    name?: string;
    photo?: string;
  };
}

interface PropertyCardProps {
  item: Property;
  onBook: (item: Property) => void;
}

export default function Home() {
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  // Estado para detectar si se ha hecho scroll y contraer el header
  const [isScrolled, setIsScrolled] = useState(false);

  // Cargar propiedades desde Supabase
  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error al obtener propiedades de Supabase:", error.message);
        } else if (data) {
          const mapped: Property[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            location: item.location_name || "Ubicación no especificada",
            rating: item.rating ? String(item.rating) : "5.0",
            price: `$${item.price} USD por noche`,
            image: item.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
            badge: "Nuevo alojamiento",
            host_info: item.host_info,
          }));
          setDbProperties(mapped);
        }
      } catch (err) {
        console.error("Error de conexión:", err);
      }
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Estado para las pestañas de "Inspiración para futuras escapadas"
  const [activeTab, setActiveTab] = useState("Populares");

  // Estado para la categoría superior activa
  const [activeCategory, setActiveCategory] = useState("Todo");

  const categories = [
    { name: "Todo", icon: "🌍" },
    { name: "Alojamientos", icon: "🏡" },
    { name: "Experiencias", icon: "🎈" },
    { name: "Servicios", icon: "🛎️" },
  ];

  const santiagoStays: Property[] = [
    { id: 1, title: "Departamento en Santiago de los Caballeros", location: "Santiago de los Caballeros", rating: "5.0", price: "$177 USD por 2 noches", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600", badge: "Favorito entre huéspedes" },
    { id: 2, title: "Departamento de Lujo en Santiago", location: "Santiago de los Caballeros", rating: "5.0", price: "$106 USD por 2 noches", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600", badge: "Favorito entre huéspedes" },
    { id: 3, title: "Penthouse con Piscina Privada", location: "Santiago de los Caballeros", rating: "4.93", price: "$184 USD por 2 noches", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600", badge: "Favorito entre huéspedes" },
    { id: 4, title: "Estudio Moderno en Santiago", location: "Santiago de los Caballeros", rating: "4.93", price: "$151 USD por 2 noches", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600", badge: "Favorito entre huéspedes" },
  ];

  const puntaCanaStays: Property[] = [
    { id: 5, title: "Condominio en Punta Cana", location: "Punta Cana", rating: "4.88", price: "$90 USD por 2 noches", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600", badge: "Favorito entre huéspedes" },
    { id: 6, title: "Villa de Playa en Punta Cana", location: "Punta Cana", rating: "4.85", price: "$70 USD por 2 noches", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600", badge: "Favorito entre huéspedes" },
    { id: 7, title: "Residencia frente al Mar", location: "Punta Cana", rating: "4.80", price: "$68 USD por 2 noches", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600", badge: "Favorito entre huéspedes" },
    { id: 8, title: "Alojamiento Exclusivo Bávaro", location: "Punta Cana", rating: "5.00", price: "$122 USD por 2 noches", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600", badge: "Favorito entre huéspedes" },
  ];

  const inspirationData: Record<string, { city: string; desc: string }[]> = {
    Populares: [
      { city: "Dallas", desc: "Condominios" },
      { city: "Cleveland", desc: "Alojamientos para estancias largas" },
      { city: "Portland", desc: "Casas en renta" },
      { city: "Barcelona", desc: "Alojamientos para estancias largas" },
      { city: "Kauai", desc: "Alojamientos para estancias largas" },
      { city: "Galveston", desc: "Villas" },
      { city: "Raleigh", desc: "Alojamientos para estancias largas" },
      { city: "Mineápolis", desc: "Condominios" },
      { city: "Gulf Shores", desc: "Departamentos" },
      { city: "Ámsterdam", desc: "Casas en renta" },
      { city: "Filadelfia", desc: "Alquileres vacacionales" },
    ],
    "Arte y cultura": [
      { city: "París", desc: "Departamentos artísticos" },
      { city: "Florencia", desc: "Casas históricas" },
      { city: "Roma", desc: "Lofts céntricos" },
      { city: "Viena", desc: "Estancias culturales" },
      { city: "Kioto", desc: "Casas tradicionales" },
    ],
    Playa: [
      { city: "Punta Cana", desc: "Villas frente al mar" },
      { city: "Las Terrenas", desc: "Cabañas de playa" },
      { city: "Malibu", desc: "Casas de lujo" },
      { city: "Miami", desc: "Condominios con vista" },
    ],
    Montañas: [
      { city: "Jarabacoa", desc: "Cabañas alpinas" },
      { city: "Aspen", desc: "Refugios de esquí" },
      { city: "Bariloche", desc: "Cabañas de madera" },
    ],
    "Al aire libre": [
      { city: "Constanza", desc: "Villas de campo" },
      { city: "Banff", desc: "Refugios naturales" },
    ],
    Actividades: [
      { city: "Orlando", desc: "Casas vacacionales" },
      { city: "Dubái", desc: "Penthouses de aventura" },
    ]
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim() !== "") {
      setProfileImage(tempUrl);
      setTempUrl("");
      setIsEditingProfile(false);
    }
  };

  const handleBook = (property: Property) => {
    setBookingMessage(`¡Reserva simulada con éxito para "${property.title}"!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Header Principal con transición de tamaño */}
      <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 px-6 transition-all duration-300 ${isScrolled ? "py-3 shadow-sm" : "py-4"}`}>
        
        {/* Fila Superior: Logo, Categorías y Perfil */}
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo actualizado */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src="/logo1.png"
                alt="Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Menú de categorías superior */}
          <div className={`hidden md:flex items-center gap-10 transition-all duration-300 ${isScrolled ? "opacity-0 pointer-events-none scale-95 h-0 overflow-hidden" : "opacity-100 h-auto"}`}>
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.name;
              return (
                <div 
                  key={idx} 
                  onClick={() => setActiveCategory(cat.name)}
                  className="flex items-center gap-3 cursor-pointer py-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition">{cat.icon}</span>
                  <div className="flex flex-col">
                    <span className={`text-sm tracking-wide ${isActive ? "font-bold text-black" : "font-medium text-gray-600 hover:text-black"}`}>
                      {cat.name}
                    </span>
                    {isActive && <div className="h-[2px] bg-black w-full mt-0.5 rounded-full"></div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opciones de la derecha */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold hidden sm:block">Pon tu espacio</span>
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-3.018m15.686 0c-.347-.324-.712-.634-1.092-.927M4.157 7.482A11.953 11.953 0 0012 10.5c2.998 0 5.74-1.1 7.843-3.018" />
              </svg>
            </div>
            <div 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 border border-gray-300 rounded-full py-1.5 px-3 hover:shadow-md transition cursor-pointer bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <img src={profileImage} alt="Perfil" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
            </div>
          </div>
        </div>

        {/* Buscador Dinámico */}
        <div className={`flex justify-center transition-all duration-300 ${isScrolled ? "mt-0" : "mt-3"}`}>
          {!isScrolled ? (
            /* --- BUSCADOR EXPANDIDO --- */
            <div className="flex items-center border border-gray-300 rounded-full py-3 px-6 shadow-md hover:shadow-lg transition cursor-pointer bg-white max-w-3xl w-full justify-between">
              <div className="flex flex-col px-4 hover:bg-gray-100 rounded-full py-1 flex-1">
                <span className="text-xs font-bold text-gray-900">Destino</span>
                <span className="text-sm text-gray-500">Buscar destinos</span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200"></div>
              <div className="flex flex-col px-4 hover:bg-gray-100 rounded-full py-1 flex-1">
                <span className="text-xs font-bold text-gray-900">Fechas</span>
                <span className="text-sm text-gray-500">Agregar fechas</span>
              </div>
              <div className="h-8 w-[1px] bg-gray-200"></div>
              <div className="flex flex-col px-4 hover:bg-gray-100 rounded-full py-1 flex-1">
                <span className="text-xs font-bold text-gray-900">Huéspedes</span>
                <span className="text-sm text-gray-500">¿Cuántos?</span>
              </div>
              <div className="bg-[#FF385C] text-white p-3 rounded-full flex items-center justify-center hover:bg-[#e00b41] transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>
          ) : (
            /* --- BUSCADOR COMPACTO --- */
            <div className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer bg-white gap-4 text-xs font-medium">
              <span className="px-2 border-r border-gray-300">Cualquier lugar</span>
              <span className="px-2 border-r border-gray-300">Cualquier fecha</span>
              <span className="text-gray-500 px-1">¿Cuántos?</span>
              <div className="bg-[#FF385C] text-white p-2 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Panel para cambiar foto */}
      {isEditingProfile && (
        <div className="bg-gray-100 border-b border-gray-300 p-4 text-center">
          <form onSubmit={handleSaveProfile} className="inline-flex flex-col sm:flex-row gap-2 items-center">
            <span className="text-sm font-medium">Cambiar foto de perfil en vivo:</span>
            <input 
              type="url" 
              placeholder="Pega la URL de una imagen..." 
              value={tempUrl} 
              onChange={(e) => setTempUrl(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-72 focus:outline-none focus:border-[#FF385C]"
            />
            <button type="submit" className="bg-[#FF385C] text-white px-4 py-1 rounded-lg text-sm font-medium">Actualizar</button>
            <button type="button" onClick={() => setIsEditingProfile(false)} className="text-gray-500 text-sm px-2">Cancelar</button>
          </form>
        </div>
      )}

      {bookingMessage && (
        <div className="bg-green-100 border border-green-300 text-green-900 p-3 text-center font-semibold sticky top-28 z-40">
          {bookingMessage}
        </div>
      )}

      {/* CONTENIDO DE ALOJAMIENTOS */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-12">
        {/* SECCIÓN DE ALOJAMIENTOS PUBLICADOS DESDE EL PANEL DE CONTROL (SUPABASE) */}
        {dbProperties.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Alojamiento(s) publicados recientemente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {dbProperties.map((item) => (
                <PropertyCard key={item.id} item={item} onBook={handleBook} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Alojamientos populares en Santiago de los Caballeros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {santiagoStays.map((item) => (
              <PropertyCard key={item.id} item={item} onBook={handleBook} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Disponibles en Punta Cana este fin de semana</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {puntaCanaStays.map((item) => (
              <PropertyCard key={item.id} item={item} onBook={handleBook} />
            ))}
          </div>
        </section>

        {/* SECCIÓN INSPIRACIÓN PARA FUTURAS ESCAPADAS */}
        <section className="border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Inspiración para futuras escapadas</h2>
          
          <div className="flex gap-6 border-b border-gray-200 pb-3 mb-6 text-sm overflow-x-auto">
            {Object.keys(inspirationData).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-semibold pb-1 transition whitespace-nowrap ${
                  activeTab === tab 
                    ? "text-black border-b-2 border-black" 
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-4 text-sm">
            {inspirationData[activeTab]?.map((item, index) => (
              <div key={index} className="cursor-pointer">
                <h4 className="font-semibold text-gray-900">{item.city}</h4>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-16 py-12 px-6 text-sm text-gray-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-gray-300">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Asistencia</h4>
            <ul className="space-y-3">
              <li className="hover:underline cursor-pointer">Centro de Ayuda</li>
              <li className="hover:underline cursor-pointer">AirCover</li>
              <li className="hover:underline cursor-pointer">Opciones de cancelación</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Cómo ser anfitrión</h4>
            <ul className="space-y-3">
              <li className="hover:underline cursor-pointer">Pon tu espacio en Airbnb</li>
              <li className="hover:underline cursor-pointer">AirCover para anfitriones</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Airbnb</h4>
            <ul className="space-y-3">
              <li className="hover:underline cursor-pointer">Sala de prensa</li>
              <li className="hover:underline cursor-pointer">Empleo</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PropertyCard({ item, onBook }: PropertyCardProps) {
  return (
    <div className="group flex flex-col">
      {/* Clic en la imagen te lleva al detalle */}
      <Link href={`/property/${item.id}`} className="block relative aspect-square w-full overflow-hidden rounded-xl bg-gray-200 mb-3 cursor-pointer">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          {item.badge}
        </span>
      </Link>
      
      {/* Clic en el título también redirige */}
      <div className="flex justify-between items-start">
        <Link href={`/property/${item.id}`} className="font-semibold text-sm text-gray-900 truncate hover:underline">
          {item.title}
        </Link>
        <span className="text-sm font-medium flex items-center gap-1">★ {item.rating}</span>
      </div>
      
      <p className="text-gray-500 text-sm">{item.location}</p>
      
      {/* Info del anfitrión si está disponible */}
      {item.host_info?.name && (
        <div className="flex items-center gap-2 mt-1 mb-1">
          {item.host_info.photo ? (
            <img src={item.host_info.photo} alt={item.host_info.name} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 text-[10px] flex items-center justify-center font-bold">
              {item.host_info.name.charAt(0)}
            </div>
          )}
          <span className="text-xs text-gray-600">
            Anfitrión: <strong className="text-gray-800">{item.host_info.name}</strong>
          </span>
        </div>
      )}

      <p className="text-sm font-medium mt-1 text-gray-900">{item.price}</p>
      
      <button 
        onClick={() => onBook(item)}
        className="mt-3 bg-gray-100 hover:bg-[#FF385C] hover:text-white text-gray-800 text-xs font-semibold py-2 rounded-lg transition"
      >
        Simular Reserva
      </button>
    </div>
  );
}