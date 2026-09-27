"use client";

import Image from "next/image";
import Link from "next/link";
import { Property } from "@/types/property";

interface PropertyCardProps {
  item: Property;
  onBook?: (item: Property) => void;
}

export default function PropertyCard({ item, onBook }: PropertyCardProps) {
  return (
    <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
      <div className="relative h-48 w-full bg-gray-200">
        {/* Usamos un placeholder si la imagen es una URL externa */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {item.badge && (
          <span className="absolute top-3 left-3 bg-white text-xs font-semibold px-2 py-1 rounded-full shadow">
            {item.badge}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
          <span className="text-sm font-semibold">★ {item.rating}</span>
        </div>
        <p className="text-sm text-gray-500">{item.location}</p>
        <div className="flex justify-between items-center pt-2">
          <span className="font-semibold text-gray-900">{item.price}</span>
          <Link
            href={`/property/${item.id}`}
            className="text-sm text-rose-500 font-semibold hover:underline"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}