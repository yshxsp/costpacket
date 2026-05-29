'use client'

import { useState, useEffect } from 'react'
import { Truck, Navigation, Activity, Zap, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface Asset {
  id: string
  name: string
  status: 'active' | 'idle' | 'warning'
  fuel: number
  location: string
  lat: number
  lng: number
}

const initialAssets: Asset[] = [
  { id: '1', name: 'CAT Excavator 320', status: 'active', fuel: 82, location: 'Zone A', lat: 40.7128, lng: -74.0060 },
  { id: '2', name: 'Bobcat T76', status: 'idle', fuel: 45, location: 'Zone B', lat: 40.7130, lng: -74.0065 },
  { id: '3', name: 'Concrete Mixer #04', status: 'warning', fuel: 12, location: 'Storage', lat: 40.7125, lng: -74.0055 },
]

export function AssetTracker() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)

  // Simple simulation of "live" data
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(a => ({
        ...a,
        fuel: Math.max(0, a.fuel - (Math.random() > 0.8 ? 1 : 0)),
        lat: a.lat + (Math.random() - 0.5) * 0.0001,
        lng: a.lng + (Math.random() - 0.5) * 0.0001,
      })))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            BuildOps Bridge: IoT Assets
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Real-time hardware telemetry integration (Simulated)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Stream Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <motion.div 
            key={asset.id}
            layout
            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Truck className={`w-5 h-5 ${asset.status === 'warning' ? 'text-red-400' : 'text-zinc-400'}`} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                asset.status === 'active' ? 'bg-green-500/10 text-green-400' : 
                asset.status === 'idle' ? 'bg-zinc-500/10 text-zinc-400' : 
                'bg-red-500/10 text-red-400'
              }`}>
                {asset.status.toUpperCase()}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-white truncate">{asset.name}</h3>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Fuel Level
                </span>
                <span className={`font-mono ${asset.fuel < 20 ? 'text-red-400' : 'text-white'}`}>{asset.fuel}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   animate={{ width: `${asset.fuel}%` }}
                   className={`h-full ${asset.fuel < 20 ? 'bg-red-500' : 'bg-orange-500'}`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {asset.location}
                </span>
                <span className="text-zinc-600 font-mono text-[10px]">{asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
        <p className="text-[10px] text-zinc-500 leading-relaxed text-center italic">
          BuildOps Pro automatically triggers task completion when equipment is detected at the GPS coordinates of the task zone for more than 4 hours. No manual input required.
        </p>
      </div>
    </div>
  )
}
