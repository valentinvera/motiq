import { useSyncExternalStore } from "react"

export const ONBOARDING_FLOW_FLAG = "motiq:onboarding-active"

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): boolean {
  return window.sessionStorage.getItem(ONBOARDING_FLOW_FLAG) === "1"
}

function getServerSnapshot(): boolean {
  return false
}

export function useOnboardingFlowActive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function isOnboardingFlowActive(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  return window.sessionStorage.getItem(ONBOARDING_FLOW_FLAG) === "1"
}

export function startOnboardingFlow(): void {
  if (typeof window === "undefined") {
    return
  }
  window.sessionStorage.setItem(ONBOARDING_FLOW_FLAG, "1")
  notify()
}

export function endOnboardingFlow(): void {
  if (typeof window === "undefined") {
    return
  }
  window.sessionStorage.removeItem(ONBOARDING_FLOW_FLAG)
  notify()
}
