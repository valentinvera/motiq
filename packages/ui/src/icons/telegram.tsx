import type { IconProps } from "./types"

export const TelegramIcon = ({ className, size }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    focusable="false"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" fill="#26A5E4" r="12" />
    <path
      d="M17.436 8.231l-1.875 8.835c-.141.625-.512.781-1.035.488l-2.852-2.102-1.375 1.328c-.152.152-.281.281-.578.281l.203-2.922 5.32-4.805c.231-.203-.05-.316-.356-.117l-6.57 4.141-2.836-.887c-.617-.191-.629-.617.129-.91l11.078-4.273c.512-.188.961.121.773.922z"
      fill="white"
    />
  </svg>
)
