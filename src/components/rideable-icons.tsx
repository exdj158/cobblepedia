import type { JSX } from "solid-js"
import {
  IconBirdClass,
  IconBoatClass,
  IconDolphinClass,
  IconHorseClass,
  IconHoverClass,
  IconJetClass,
  IconRocketClass,
  IconSubmarineClass,
} from "@/assets/icons"

type IconProps = {
  class?: string
}

export function RideableCategoryIcon(props: { category: string; class?: string }) {
  const category = props.category.trim().toUpperCase()

  if (category === "AIR") {
    return (
      <IconBase class={props.class}>
        <path d="M3 12C6 10 8 8 11 4" />
        <path d="M7 12C9 11 11 10 14 7" />
        <path d="M11 12C13 12 15 11 18 9" />
      </IconBase>
    )
  }

  if (category === "LIQUID") {
    return (
      <IconBase class={props.class}>
        <path d="M2 10c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
        <path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      </IconBase>
    )
  }

  return (
    <IconBase class={props.class}>
      <path d="M4 16c1.5-3 4.2-6 8-8" />
      <path d="M12 8c3 1 5 4 6 8" />
      <path d="M8 18h8" />
    </IconBase>
  )
}

export function RideableClassIcon(props: { classId: string; class?: string }) {
  const classId = props.classId.trim().toLowerCase()

  if (classId === "bird") {
    return <IconBirdClass class={props.class} aria-hidden="true" />
  }

  if (classId === "boat") {
    return <IconBoatClass class={props.class} aria-hidden="true" />
  }

  if (classId === "dolphin") {
    return <IconDolphinClass class={props.class} aria-hidden="true" />
  }

  if (classId === "horse") {
    return <IconHorseClass class={props.class} aria-hidden="true" />
  }

  if (classId === "hover") {
    return <IconHoverClass class={props.class} aria-hidden="true" />
  }

  if (classId === "jet") {
    return <IconJetClass class={props.class} aria-hidden="true" />
  }

  if (classId === "rocket") {
    return <IconRocketClass class={props.class} aria-hidden="true" />
  }

  if (classId === "submarine") {
    return <IconSubmarineClass class={props.class} aria-hidden="true" />
  }

  return (
    <IconBase class={props.class}>
      <circle cx="12" cy="12" r="8" />
    </IconBase>
  )
}

function IconBase(props: IconProps & { children: JSX.Element }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      {props.children}
    </svg>
  )
}
