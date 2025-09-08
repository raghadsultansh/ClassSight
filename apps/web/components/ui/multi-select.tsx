import * as React from "react"
import { Check, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Simple Badge component inline to avoid import issues
const Badge = ({ children, variant = "secondary", className, ...props }: {
  children: React.ReactNode
  variant?: "secondary" | "default"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
      variant === "secondary" 
        ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
        : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      className
    )} 
    {...props}
  >
    {children}
  </div>
)

interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const selectedOptions = options.filter(option => selected.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-h-[40px] h-auto py-2 px-3 border-slate-200 dark:border-slate-800",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 max-w-full">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {option.label}
                  <div
                    className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(option.value)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </div>
                </Badge>
              ))
            ) : (
              <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
        <div className="max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No options available
            </div>
          ) : (
            <div className="p-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                    selected.includes(option.value) && "bg-slate-100 dark:bg-slate-800"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300 dark:border-slate-600",
                      selected.includes(option.value) && "bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900"
                    )}
                  >
                    {selected.includes(option.value) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
