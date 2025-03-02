"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

type SliderProps = Omit<React.ComponentProps<typeof Slider>, "value" | "onValueChange"> & {
  initialValue?: number
  value?: number
  onChange?: (value: number) => void
  className?: string
}

export function Slidercomp({ className, initialValue = 50, value: externalValue, onChange, ...props }: SliderProps) {
  const [internalValue, setInternalValue] = useState<number>(initialValue)

  // Use external value if provided, otherwise use internal state
  const currentValue = externalValue !== undefined ? externalValue : internalValue

  useEffect(() => {
    // Update internal state if external value changes
    if (externalValue !== undefined) {
      setInternalValue(externalValue)
    }
  }, [externalValue])

  const handleValueChange = (newValue: number[]) => {
    const value = newValue[0]
    setInternalValue(value)
    onChange?.(value)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <Slider
          value={[currentValue]}
          onValueChange={handleValueChange}
          max={100}
          step={1}
          className={cn("w-[80%]", className)}
          {...props}
        />
        <div className="ml-4 min-w-14 px-2 py-1 bg-secondary rounded-md text-center">{currentValue}%</div>
      </div>
    </div>
  )
}


