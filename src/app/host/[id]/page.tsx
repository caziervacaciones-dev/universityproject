"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Host {
  id: string;
  name: string;
  photo: string;
  bio: string;
  rating: number;
}

interface Property {
  id: string | number;
  title: string;
  location_name: string;
  price: number;
  images: string[];
  rating: number;
}

export default function HostProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [host, setHost] = useState<Host | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHostAndProperties() {
      if (!id) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Obtener información del anfitrión usando maybeSingle()
        const { data: hostData, error: hostError } = await supabase
          .from("hosts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (hostError) {
          console.error("Error al buscar anfitrión en Supabase:", hostError);
          throw new Error(hostError.message);
        }

        if (!hostData) {
          setErrorMsg("No se encontró ningún anfitrión con ese ID en la base de datos.");
          return;
        }

        setHost(hostData);

        // 2. Obtener propiedades asignadas
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .select("*")
          .eq("host_id", id);

        if (propError) {
          console.error("Error al buscar propiedades:", propError);
        } else {
          setProperties(propData || []);
        }
      } catch (err: any) {
        console.error("Error en la petición:", err);
        setErrorMsg(err.message || "Error desconocido al conectar con la base de datos");
      } finally {
        setLoading(false);
      }
    }

    fetchHostAndProperties();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Cargando perfil del anfitrión...
      </div>
    );
  }

  if (errorMsg || !host) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Anfitrión no encontrado</h1>
        <p className="text-gray-500 max-w-md">{errorMsg}</p>
        <p className="text-xs text-gray-400 bg-gray-100 p-2 rounded">ID buscado: {id}</p>
        <Link href="/" className="text-[#FF385C] font-semibold underline mt-2">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-black mb-6 inline-block">
        ← Volver al inicio
      </Link>

      {/* Tarjeta del Perfil */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
        <img
          src={host.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
          alt={host.name}
          className="w-32 h-32 rounded-full object-cover shadow-md"
        />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900">{host.name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-gray-600">
            <span>★ {host.rating || "5.0"} evaluación</span>
            <span>•</span>
            <span>Anfitrión verificado</span>
          </div>
          {host.bio && <p className="mt-4 text-gray-700 text-sm leading-relaxed max-w-2xl">{host.bio}</p>}
        </div>
      </div>

      {/* Propiedades del Anfitrión */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Alojamientos de {host.name} ({properties.length})
        </h2>

        {properties.length === 0 ? (
          <p className="text-gray-500">Este anfitrión aún no tiene propiedades asociadas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {properties.map((item) => (
              <Link key={item.id} href={`/property/${item.id}`} className="group block">
                <div className="aspect-square w-full rounded-xl bg-gray-200 overflow-hidden mb-3">
                  <img
                    src={item.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-base truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.location_name || "Ubicación no especificada"}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">${item.price} USD / noche</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}