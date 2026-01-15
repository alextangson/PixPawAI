import { Shield, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBadgeProps {
  icon?: 'shield' | 'clock' | 'sparkles'
  text: string
  className?: string
}

export function TrustBadge({ icon = 'shield', text, className }: TrustBadgeProps) {
  const icons = {
    shield: Shield,
    clock: Clock,
    sparkles: Sparkles,
  }
  
  const Icon = icons[icon]

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon className="w-4 h-4 text-coral" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}

export function TrustBadgeGroup({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-row flex-wrap gap-4 items-center', className)}>
      <TrustBadge icon="shield" text="100% Cuteness Guarantee" />
      <TrustBadge icon="clock" text="Ready in 30 Seconds" />
      <TrustBadge icon="sparkles" text="Love it or Free Redo" />
    </div>
  )
}
