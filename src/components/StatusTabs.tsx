import { useLayoutEffect, useRef } from 'react'
import type { ReactNode, Ref } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Item<T extends string> = { value: T; label: string; icon: LucideIcon; count?: number }

type Props<T extends string> = {
  label: string
  value: T
  onValueChange: (value: T) => void
  items: Item<T>[]
  actions?: ReactNode
  busy?: boolean
  panelRef?: Ref<HTMLDivElement>
  children: ReactNode
}

export function StatusTabs<T extends string>({
  label,
  value,
  onValueChange,
  items,
  actions,
  busy = false,
  panelRef,
  children,
}: Props<T>) {
  const list = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const place = () => {
      const active = list.current?.querySelector<HTMLElement>('[data-state="active"]')
      const box = indicator.current
      if (!active || !box) return
      box.style.translate = `${active.offsetLeft}px ${active.offsetTop}px`
      box.style.width = `${active.offsetWidth}px`
      box.style.height = `${active.offsetHeight}px`
      requestAnimationFrame(() => box.setAttribute('data-ready', 'true'))
    }
    place()
    if (typeof ResizeObserver === 'undefined' || !list.current) return
    const observer = new ResizeObserver(place)
    observer.observe(list.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as T)} className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList
          ref={list}
          aria-label={label}
          className="relative max-w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto"
        >
          <span
            ref={indicator}
            data-slot="tab-indicator"
            data-for={value}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 rounded-md border border-input bg-background opacity-0 shadow-sm data-[ready=true]:opacity-100 data-[ready=true]:transition-[translate,width,height] data-[ready=true]:duration-300 data-[ready=true]:ease-[cubic-bezier(.3,1.2,.5,1)] motion-reduce:data-[ready=true]:transition-none dark:border-muted-foreground dark:bg-input/30"
          />
          {items.map(({ value: itemValue, label: itemLabel, icon: Icon, count }) => (
            <TabsTrigger
              key={itemValue}
              value={itemValue}
              className="relative z-10 text-muted-foreground data-active:border-transparent data-active:bg-transparent data-active:shadow-none group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
            >
              <Icon aria-hidden />
              {itemLabel}
              {count !== undefined && <span className="font-mono text-xs">{count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
      </div>
      <TabsContent
        ref={panelRef}
        value={value}
        aria-busy={busy || undefined}
        className="relative overflow-x-clip focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
