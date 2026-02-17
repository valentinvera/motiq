import { X as XBase } from "lucide-react"
import type { ComponentProps } from "react"

export const X = (props: ComponentProps<typeof XBase>) => <XBase {...props} />

export const XIcon = (props: ComponentProps<typeof XBase>) => (
  <XBase {...props} />
)
