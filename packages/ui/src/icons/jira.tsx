import type { IconProps } from "./types"

export const JiraIcon = ({ className, size }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    focusable="false"
    height={size}
    viewBox="0 0 415 415"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M397.569 0H197.773C197.773 23.9202 207.276 46.8606 224.19 63.7747C241.104 80.6889 264.044 90.1911 287.964 90.1911H324.769V125.724C324.801 175.491 365.136 215.826 414.902 215.858V17.3333C414.902 7.7604 407.142 0 397.569 0Z"
      fill="#2684FF"
    />
    <path
      d="M298.711 99.5511H98.9156C98.9474 149.317 139.283 189.653 189.049 189.684H225.853V225.333C225.917 275.099 266.278 315.409 316.044 315.409V116.884C316.044 107.312 308.284 99.5511 298.711 99.5511Z"
      fill="url(#paint0_linear_1_6)"
    />
    <path
      d="M199.796 199.044H0C0 248.856 40.3799 289.236 90.1911 289.236H127.111V324.769C127.143 374.49 167.408 414.807 217.129 414.902V216.378C217.129 206.805 209.368 199.044 199.796 199.044Z"
      fill="url(#paint1_linear_1_6)"
    />
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="paint0_linear_1_6"
        x1="267.686"
        x2="183.212"
        y1="57.651"
        y2="145.796"
      >
        <stop offset="0.18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="paint1_linear_1_6"
        x1="6323.71"
        x2="2694.55"
        y1="5857.6"
        y2="9449.2"
      >
        <stop offset="0.18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
    </defs>
  </svg>
)
