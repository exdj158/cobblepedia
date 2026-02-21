import type { FlowProps } from "solid-js"
import { useMetadata } from "vike-metadata-solid"
import CommandPalette from "@/components/command-palette"
import getTitle from "@/utils/get-title"
import "@/styles/app.css"

useMetadata.setGlobalDefaults({
  title: getTitle("Home"),
  description: "Fast, comprehensive Cobblemon reference.",
})

export default function RootLayout(props: FlowProps) {
  const openPalette = () => {
    window.dispatchEvent(new CustomEvent("cobblepedia:open-palette"))
  }

  return (
    <div class="min-h-screen bg-background">
      <header class="sticky top-0 z-40 border-border border-b bg-background">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" class="flex items-center gap-2 font-medium text-sm">
            <span class="font-mono text-muted-foreground text-xs">CP._</span>
            <span>Cobblepedia</span>
          </a>
          <button
            type="button"
            class="flex items-center gap-2 border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-muted-foreground hover:text-foreground"
            onClick={openPalette}
          >
            <span>Search</span>
            <kbd class="bg-secondary px-1.5 py-0.5 font-mono">Cmd</kbd>
            <span>+</span>
            <kbd class="bg-secondary px-1.5 py-0.5 font-mono">K</kbd>
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{props.children}</main>
      <CommandPalette />
    </div>
  )
}
