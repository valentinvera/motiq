import type { IconProps } from "./types"

export const VercelIcon = ({ className, size }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    focusable="false"
    height={size}
    viewBox="0 0 512 512"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256,48,496,464H16Z" />
  </svg>
)
