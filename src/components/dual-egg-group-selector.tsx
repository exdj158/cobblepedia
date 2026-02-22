import { createMemo, createSignal, For } from "solid-js"
import { IconEgg, IconX } from "@/assets/icons"
import { canonicalId, formatEggGroup } from "@/data/formatters"

const EGG_GROUP_COLORS: Record<string, string> = {
  monster: "#8b5cf6",
  water1: "#38bdf8",
  bug: "#84cc16",
  flying: "#818cf8",
  field: "#d97706",
  fairy: "#f472b6",
  grass: "#22c55e",
  human_like: "#f97316",
  water3: "#0ea5e9",
  mineral: "#94a3b8",
  amorphous: "#a78bfa",
  water2: "#0284c7",
  ditto: "#e879f9",
  dragon: "#6366f1",
  undiscovered: "#64748b",
}

type DualEggGroupSelectorProps = {
  availableEggGroups: string[]
  selectedEggGroups: string[]
  onChange: (eggGroups: string[]) => void
}

export function DualEggGroupSelector(props: DualEggGroupSelectorProps) {
  const [inputValue, setInputValue] = createSignal("")
  const [isOpen, setIsOpen] = createSignal(false)
  const [highlightedIndex, setHighlightedIndex] = createSignal(0)
  let inputRef: HTMLInputElement | undefined

  const options = createMemo(() => {
    if (props.selectedEggGroups.length >= 2) {
      return []
    }

    const query = canonicalId(inputValue().trim())

    return props.availableEggGroups
      .filter((group) => {
        if (props.selectedEggGroups.includes(group)) return false
        if (!query) return true

        const label = formatEggGroup(group)
        return canonicalId(group).includes(query) || canonicalId(label).includes(query)
      })
      .map((group) => ({
        value: group,
        label: formatEggGroup(group),
        color: EGG_GROUP_COLORS[group] ?? "#9ca3af",
      }))
  })

  const focusInput = () => {
    setTimeout(() => inputRef?.focus(), 0)
  }

  const addEggGroup = (group: string) => {
    if (props.selectedEggGroups.length >= 2) return
    if (props.selectedEggGroups.includes(group)) return
    props.onChange([...props.selectedEggGroups, group])
    setInputValue("")
    setIsOpen(false)
    setHighlightedIndex(0)
    focusInput()
  }

  const removeEggGroup = (group: string) => {
    props.onChange(props.selectedEggGroups.filter((item) => item !== group))
    focusInput()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const opts = options()

    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!opts.length) return
      setIsOpen(true)
      setHighlightedIndex((index) => (index + 1) % opts.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!opts.length) return
      setIsOpen(true)
      setHighlightedIndex((index) => (index - 1 + opts.length) % opts.length)
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const selected = opts[highlightedIndex()]
      if (selected) {
        addEggGroup(selected.value)
      }
      return
    }

    if (event.key === "Escape") {
      setIsOpen(false)
      return
    }

    if (event.key === "Backspace" && inputValue() === "" && props.selectedEggGroups.length > 0) {
      event.preventDefault()
      removeEggGroup(props.selectedEggGroups[props.selectedEggGroups.length - 1])
    }
  }

  return (
    <div class="w-full">
      <div class="relative">
        <div class="flex min-h-[44px] flex-wrap items-center gap-1.5 border border-input bg-background px-3 py-2">
          <For each={props.selectedEggGroups}>
            {(group, index) => (
              <div
                class="inline-flex items-center gap-1.5 border px-2 py-1 text-xs"
                style={{
                  "border-color": EGG_GROUP_COLORS[group] ?? "#9ca3af",
                  color: EGG_GROUP_COLORS[group] ?? "#9ca3af",
                }}
              >
                <IconEgg class="h-3 w-3" />
                <span class="font-mono text-[10px] opacity-60">
                  {index() === 0 ? "PRIMARY" : "SECONDARY"}
                </span>
                <span class="font-mono uppercase tracking-wider">{formatEggGroup(group)}</span>
                <button
                  type="button"
                  class="ml-1 p-0.5 opacity-60 hover:opacity-100"
                  onClick={() => removeEggGroup(group)}
                >
                  <IconX class="h-3 w-3" />
                </button>
              </div>
            )}
          </For>

          <input
            ref={inputRef}
            type="text"
            value={inputValue()}
            onInput={(event) => {
              setInputValue(event.currentTarget.value)
              setIsOpen(true)
              setHighlightedIndex(0)
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 120)}
            class="min-w-[150px] flex-1 bg-transparent px-1 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
            placeholder={
              props.selectedEggGroups.length === 0
                ? "Add an egg group..."
                : "Add second egg group..."
            }
          />
        </div>

        {isOpen() && options().length > 0 ? (
          <div class="absolute inset-x-0 top-full z-50 mt-1 max-h-[280px] overflow-auto border border-border bg-popover">
            <For each={options()}>
              {(option, index) => (
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  classList={{
                    "bg-accent text-accent-foreground": highlightedIndex() === index(),
                  }}
                  onMouseEnter={() => setHighlightedIndex(index())}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addEggGroup(option.value)}
                >
                  <IconEgg class="h-3.5 w-3.5" style={{ color: option.color }} />
                  <span class="font-mono">{option.label}</span>
                </button>
              )}
            </For>
          </div>
        ) : null}
      </div>
    </div>
  )
}
