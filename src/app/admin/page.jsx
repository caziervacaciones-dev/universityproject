'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Cargar CSS de Leaflet de forma dinámica para evitar errores de SSR en Next.js
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

// Lista predefinida de amenidades populares para seleccionar rápido
const POPULAR_AMENITIES = [
  'Wifi de alta velocidad',
  'Piscina privada',
  'Aire acondicionado',
  'Estacionamiento gratuito',
  'Jacuzzi',
  'Vista al mar',
  'Cocina equipada',
  'TV / Netflix',
  'Planta eléctrica / Inversor',
  'Se permiten mascotas',
  'BBQ / Parrilla',
  'Seguridad 24/7'
];

// --- COMPONENTE MAPA INTERACTIVO (LEAFLET) ---
function MapPicker({ lat, lng, onChangeCoordinates }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const initialLat = parseFloat(lat) || 19.2905;
  const initialLng = parseFloat(lng) || -69.5447;

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!leafletMap.current) {
        const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onChangeCoordinates(position.lat.toFixed(6), position.lng.toFixed(6));
        });

        leafletMap.current = map;
        markerRef.current = marker;
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (!isNaN(numericLat) && !isNaN(numericLng) && leafletMap.current && markerRef.current) {
      const newPos = [numericLat, numericLng];
      markerRef.current.setLatLng(newPos);
      leafletMap.current.panTo(newPos);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-gray-200 shadow-inner my-3">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 shadow border border-gray-100">
        📍 Arrastra el pin para ajustar
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('property');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Lista de propiedades para el selector de edición / catálogo
  const [propertiesList, setPropertiesList] = useState([]);
  const [hostsList, setHostsList] = useState([]);

  // Estado de reservas
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Referencias para inputs de archivos
  const galleryInputRef = useRef(null);
  const hostPhotoInputRef = useRef(null);

  // Estados locales para la gestión de bloqueo de fechas
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');

  // Estado local para agregar amenidad personalizada
  const [customAmenity, setCustomAmenity] = useState('');

  const initialPropertyState = {
    id: null,
    host_id: '',
    title: '',
    price: '',
    description: '',
    location_name: '',
    lat: '19.2905',
    lng: '-69.5447',
    rating: '4.95',
    reviews_count: '0',
    guests_max: '6',
    bedrooms: '3',
    beds: '4',
    baths: '3',
    check_in: '15:00',
    check_out: '11:00',
    house_rules: 'No se permiten fiestas ruidosas después de las 11:00 PM.',
    images: [],
    amenities: [],
    blocked_dates: [], // Lista de fechas bloqueadas YYYY-MM-DD
    host_info: {
      name: '',
      photo: '',
      tenure: '3 años de anfitrión',
      rating: '4.98',
      bio: '',
      co_hosts: []
    },
    reviews: []
  };

  const [property, setProperty] = useState(initialPropertyState);

  // Cargar propiedades y anfitriones
  const fetchAllProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error al cargar propiedades:', error.message);
      if (data) {
        setPropertiesList(data);
        if (data.length > 0 && !property.id) {
          loadPropertyToState(data[0]);
        }
      }
    } catch (err) {
      console.error('Error al obtener propiedades:', err);
    }
  };

  useEffect(() => {
    async function initData() {
      const { data: hostsData } = await supabase.from('hosts').select('*');
      if (hostsData) setHostsList(hostsData);
      await fetchAllProperties();
    }
    initData();
  }, []);

  const loadPropertyToState = (data) => {
    setProperty({
      id: data.id || null,
      host_id: data.host_id || '',
      title: data.title || '',
      price: data.price !== undefined ? String(data.price) : '',
      description: data.description || '',
      location_name: data.location_name || '',
      lat: String(data.lat || data.latitude || '19.2905'),
      lng: String(data.lng || data.longitude || '-69.5447'),
      rating: data.rating !== undefined ? String(data.rating) : '4.95',
      reviews_count: data.reviews_count !== undefined ? String(data.reviews_count) : '0',
      guests_max: data.guests_max !== undefined ? String(data.guests_max) : '1',
      bedrooms: data.bedrooms !== undefined ? String(data.bedrooms) : '1',
      beds: data.beds !== undefined ? String(data.beds) : '1',
      baths: data.baths !== undefined ? String(data.baths) : '1',
      check_in: data.check_in || '15:00',
      check_out: data.check_out || '11:00',
      house_rules: data.house_rules || '',
      images: Array.isArray(data.images) ? data.images : [],
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      blocked_dates: Array.isArray(data.blocked_dates) ? data.blocked_dates : [],
      host_info: data.host_info || { name: '', photo: '', tenure: '', rating: '', bio: '', co_hosts: [] },
      reviews: Array.isArray(data.reviews) ? data.reviews : []
    });
  };

  const handleCreateNew = () => {
    setProperty(initialPropertyState);
  };

  // Cargar reservas en tiempo real
  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) setReservations(data);
    } catch (err) {
      console.error('Error cargando reservas:', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const channel = supabase
      .channel('realtime-reservations-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetchReservations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const geocodeAddress = async () => {
    if (!property.location_name.trim()) {
      alert('Ingresa una ubicación o dirección para buscar en el mapa.');
      return;
    }

    try {
      setGeocoding(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(property.location_name)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const topResult = data[0];
        setProperty((prev) => ({
          ...prev,
          lat: String(parseFloat(topResult.lat).toFixed(6)),
          lng: String(parseFloat(topResult.lon).toFixed(6)),
        }));
      } else {
        alert('No se encontraron coordenadas para esta dirección.');
      }
    } catch (err) {
      alert('Error buscando coordenadas: ' + err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleHostSelect = (selectedHostId) => {
    const selectedHost = hostsList.find((h) => String(h.id) === String(selectedHostId));
    if (selectedHost) {
      setProperty((prev) => ({
        ...prev,
        host_id: selectedHost.id,
        host_info: {
          ...prev.host_info,
          name: selectedHost.name || prev.host_info.name,
          photo: selectedHost.avatar_url || selectedHost.photo || prev.host_info.photo,
          bio: selectedHost.bio || prev.host_info.bio,
          tenure: selectedHost.tenure || prev.host_info.tenure
        }
      }));
    } else {
      setProperty((prev) => ({ ...prev, host_id: selectedHostId }));
    }
  };

  const handleFileUpload = async (event, targetField) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `properties/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        })
      );

      if (targetField === 'gallery') {
        setProperty((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      } else if (targetField === 'host_photo') {
        setProperty((prev) => ({ ...prev, host_info: { ...prev.host_info, photo: uploadedUrls[0] } }));
        if (hostPhotoInputRef.current) hostPhotoInputRef.current.value = '';
      }
    } catch (error) {
      alert('Error al subir la imagen: ' + (error.message || error));
    } finally {
      setUploading(false);
    }
  };

  // --- LÓGICA DE AMENIDADES ---
  const handleToggleAmenity = (amenity) => {
    setProperty((prev) => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!property.amenities.includes(customAmenity.trim())) {
      setProperty((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()]
      }));
    }
    setCustomAmenity('');
  };

  // --- LÓGICA DE BLOQUEO DE FECHAS EN FORMATO INDIVIDUAL YYYY-MM-DD ---
  const handleAddBlockedDate = () => {
    if (!blockStartDate) {
      alert('Selecciona al menos una fecha de inicio.');
      return;
    }

    const startParts = blockStartDate.split('-');
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);

    let endDate = startDate;
    if (blockEndDate) {
      const endParts = blockEndDate.split('-');
      endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    }

    if (endDate < startDate) {
      alert('La fecha final no puede ser anterior a la fecha de inicio.');
      return;
    }

    const newDates = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      newDates.push(`${year}-${month}-${day}`);

      current.setDate(current.getDate() + 1);
    }

    const updatedBlocked = Array.from(new Set([...property.blocked_dates, ...newDates])).sort();

    setProperty((prev) => ({
      ...prev,
      blocked_dates: updatedBlocked
    }));

    setBlockStartDate('');
    setBlockEndDate('');
  };

  const handleRemoveBlockedDate = (dateToRemove) => {
    setProperty((prev) => ({
      ...prev,
      blocked_dates: prev.blocked_dates.filter((date) => date !== dateToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const latNum = parseFloat(property.lat) || 19.2905;
    const lngNum = parseFloat(property.lng) || -69.5447;

    const payload = {
      host_id: property.host_id || null,
      title: property.title,
      price: parseFloat(property.price) || 0,
      description: property.description,
      location_name: property.location_name,
      lat: latNum,
      lng: lngNum,
      latitude: latNum,
      longitude: lngNum,
      rating: parseFloat(property.rating) || 0,
      reviews_count: parseInt(property.reviews_count, 10) || 0,
      guests_max: parseInt(property.guests_max, 10) || 0,
      bedrooms: parseInt(property.bedrooms, 10) || 0,
      beds: parseInt(property.beds, 10) || 0,
      baths: parseFloat(property.baths) || 0,
      check_in: property.check_in,
      check_out: property.check_out,
      house_rules: property.house_rules,
      images: property.images,
      amenities: property.amenities,
      blocked_dates: property.blocked_dates,
      host_info: property.host_info,
      reviews: property.reviews
    };

    let error;
    if (property.id) {
      const res = await supabase.from('properties').update(payload).eq('id', property.id);
      error = res.error;
    } else {
      const res = await supabase.from('properties').insert([payload]).select().single();
      error = res.error;
      if (res.data) {
        setProperty((prev) => ({ ...prev, id: res.data.id }));
      }
    }

    setLoading(false);

    if (error) {
      alert('Error al guardar en Supabase: ' + error.message);
    } else {
      alert('✨ ¡Propiedad guardada correctamente!');
      await fetchAllProperties();
    }
  };

  const totalRevenue = reservations.reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-rose-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Control Admin Panel
              </h1>
              <p className="text-xs text-slate-400">
                Gestión de catálogo de propiedades y monitoreo de reservas
              </p>
            </div>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('property')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'property'
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏡 Gestor de Propiedades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reservations')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'reservations'
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💳 Reservas Registradas ({reservations.length})
            </button>
          </div>
        </div>
      </header>

      {/* MÉTRICAS */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Propiedades en Catálogo</span>
            <div className="text-2xl font-black text-white mt-1">{propertiesList.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Total Reservas</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{reservations.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Ingresos Totales</span>
            <div className="text-2xl font-black text-rose-400 mt-1">${totalRevenue.toLocaleString()} USD</div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {activeTab === 'property' && (
          <div className="space-y-6">

            {/* BARRA DE SELECCIÓN DE PROPIEDADES */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Editar Propiedad del Catálogo
                </label>
                <select
                  value={property.id || ''}
                  onChange={(e) => {
                    const selected = propertiesList.find((p) => String(p.id) === e.target.value);
                    if (selected) loadPropertyToState(selected);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">-- Selecciona para editar una propiedad existente --</option>
                  {propertiesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-auto flex items-end">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-colors"
                >
                  ➕ Crear Nueva Publicación
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              {/* INFORMACIÓN PRINCIPAL */}
              <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                  <h2 className="text-lg font-bold text-white">
                    {property.id ? `Modificando: ${property.title}` : 'Creando Nueva Propiedad'}
                  </h2>
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                    ID: {property.id || 'Nuevo Registro'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Título de la Propiedad</label>
                    <input
                      type="text"
                      value={property.title}
                      onChange={(e) => setProperty({ ...property, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                      placeholder="Ej: Villa Luxury Frente al Mar"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Precio por Noche (USD)</label>
                      <input
                        type="number"
                        value={property.price}
                        onChange={(e) => setProperty({ ...property, price: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        placeholder="350"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Calificación</label>
                      <input
                        type="number"
                        step="0.01"
                        value={property.rating}
                        onChange={(e) => setProperty({ ...property, rating: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Reseñas Totales</label>
                      <input
                        type="number"
                        value={property.reviews_count}
                        onChange={(e) => setProperty({ ...property, reviews_count: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* CAPACIDAD Y DISTRIBUCIÓN DEL ALOJAMIENTO */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                        👥 Máx. Huéspedes
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={property.guests_max}
                        onChange={(e) => setProperty({ ...property, guests_max: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="6"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                        🛏️ Habitaciones
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={property.bedrooms}
                        onChange={(e) => setProperty({ ...property, bedrooms: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="3"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                        🛋️ Camas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={property.beds}
                        onChange={(e) => setProperty({ ...property, beds: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="4"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                        🚿 Baños
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={property.baths}
                        onChange={(e) => setProperty({ ...property, baths: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="2"
                        required
                      />
                    </div>
                  </div>

                  {/* UBICACIÓN Y MAPA */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase">Ubicación</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={property.location_name}
                        onChange={(e) => setProperty({ ...property, location_name: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        placeholder="Ej: Las Terrenas, Samaná"
                      />
                      <button
                        type="button"
                        onClick={geocodeAddress}
                        disabled={geocoding}
                        className="bg-slate-800 text-rose-400 border border-slate-700 px-5 rounded-xl font-bold text-xs"
                      >
                        {geocoding ? 'Buscando...' : '🔍 Ubicar en Mapa'}
                      </button>
                    </div>
                  </div>

                  <MapPicker
                    lat={property.lat}
                    lng={property.lng}
                    onChangeCoordinates={(newLat, newLng) => {
                      setProperty((prev) => ({ ...prev, lat: newLat, lng: newLng }));
                    }}
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Descripción</label>
                    <textarea
                      rows={4}
                      value={property.description}
                      onChange={(e) => setProperty({ ...property, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>
              </section>

              {/* AMENIDADES Y SERVICIOS */}
              <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    ✨ Amenidades y Servicios ({property.amenities.length})
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Selecciona los servicios que ofrece la propiedad o agrega nuevos manualmente.
                </p>

                {/* Selección rápida de amenidades comunes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {POPULAR_AMENITIES.map((amenity) => {
                    const isSelected = property.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <span>{amenity}</span>
                        <span className="text-base">{isSelected ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Agregar amenidad personalizada */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                    Agregar Amenidad Personalizada
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                      placeholder="Ej: Jacuzzi térmico, Gimnasio privado..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAmenity}
                      className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold px-4 rounded-xl text-xs transition-colors"
                    >
                      ➕ Añadir
                    </button>
                  </div>
                </div>

                {/* Lista de todas las amenidades seleccionadas en la propiedad */}
                {property.amenities.length > 0 && (
                  <div className="pt-2">
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-2">
                      Amenidades asignadas a esta propiedad:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200"
                        >
                          <span>✨ {item}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAmenity(item)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* CALENDARIO Y BLOQUEO DE FECHAS */}
              <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    📅 Bloqueo de Fechas / Disponibilidad
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Selecciona una fecha o rango de fechas para deshabilitarlas automáticamente en el calendario público.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Fecha Fin (Opcional)</label>
                    <input
                      type="date"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddBlockedDate}
                      className="w-full bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                    >
                      🚫 Bloquear Días
                    </button>
                  </div>
                </div>

                {/* LISTA DE FECHAS BLOQUEADAS */}
                <div className="pt-3">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Días Bloqueados ({property.blocked_dates?.length || 0}):
                  </span>
                  {property.blocked_dates && property.blocked_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                      {property.blocked_dates.map((dateStr) => (
                        <div
                          key={dateStr}
                          className="flex items-center gap-2 bg-slate-900 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300"
                        >
                          <span>🔒 {dateStr}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlockedDate(dateStr)}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No hay fechas bloqueadas actualmente.</span>
                  )}
                </div>
              </section>

              {/* GALERÍA */}
              <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Galería de Imágenes</h2>
                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                  disabled={uploading}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-rose-500/10 file:text-rose-400"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {property.images.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 h-28 bg-slate-900">
                      <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProperty((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-2 right-2 bg-rose-600 text-white w-6 h-6 rounded-full text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ANFITRIÓN */}
              <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Asignar Anfitrión</h2>
                <select
                  value={property.host_id || ''}
                  onChange={(e) => handleHostSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">-- Selecciona un Anfitrión Registrado --</option>
                  {hostsList.map((host) => (
                    <option key={host.id} value={host.id}>
                      {host.name || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </section>

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : property.id ? '💾 Guardar Cambios en Propiedad' : '✨ Publicar Nueva Propiedad'}
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA RESERVAS */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Listado de Reservas</h2>
              <button onClick={fetchReservations} className="bg-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl font-bold border border-slate-700">
                🔄 Actualizar
              </button>
            </div>

            {loadingReservations ? (
              <div className="text-center py-20 text-slate-500">Cargando reservas...</div>
            ) : reservations.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                No hay reservas registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reservations.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Estado: {item.status || 'Confirmada'}
                      </span>
                      <h3 className="text-lg font-bold text-white">{item.property_title || 'Alojamiento'}</h3>
                      <p className="text-xs text-slate-400">Fechas: {item.dates} | Huéspedes: {item.guests}</p>
                      <p className="text-xs text-slate-500 font-mono">ID Transacción: {item.id}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Pagado</span>
                      <span className="text-xl font-black text-rose-400">${item.total_price} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}