function MassiveLogo({ className }) {
  return (
    <svg
      viewBox="0 0 1180 275"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g filter="url(#logo-shadow)">
        {/* ASSIVE + part of M - main color */}
        <path d="M356.904 25.1613L533.445 25.5642V83.4735L430.459 83.0706V97.5454H533.445V227.839H356.904V169.93H459.89V155.455H356.904V25.1613Z" fill="var(--logo-main)" />
        <path d="M549.105 25.0504L814.891 25.1511V83.0906L622.711 82.9899V97.4748H725.756V227.839H549.115V169.899H652.161V155.414H549.115V25.0504H549.105Z" fill="var(--logo-main)" />
        <path d="M814.891 97.8274V228H741.336V97.8274H814.891Z" fill="var(--logo-main)" />
        <path d="M960.655 25.0907H1034.21L917.565 228L828.24 226.882V25.0907H901.795L902.649 112.282L960.655 25.0907Z" fill="var(--logo-main)" />
        <path d="M1134 155.354L974.576 155.586L1008.04 97.505L1134 97.2834V155.354Z" fill="var(--logo-main)" />
        <path d="M1134 227.849H933.064L966.515 169.778H1134V227.849Z" fill="var(--logo-main)" />
        <path d="M1134 83.282L1015.83 83.0906L1049.24 25L1134 25.2015V83.282Z" fill="var(--logo-main)" />
        <path d="M207.431 102.592V178.854L270.654 143.619L270.794 227.839L340.581 227.668V25.3325L207.431 102.592Z" fill="var(--logo-main)" />
        {/* M letter - accent color */}
        <path d="M25 25.1611C25 25.1611 25.0302 225.048 25 227.839H94.9771V82.7179H122.789L122.799 227.728L192.203 227.829V92.3375C192.203 92.3375 304.215 28.9284 307.773 25.1611" fill="var(--logo-accent)" />
      </g>
      <defs>
        <filter id="logo-shadow" x="0" y="0" width="1181" height="275" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="11" dy="11" />
          <feGaussianBlur stdDeviation="18" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

export default MassiveLogo;
