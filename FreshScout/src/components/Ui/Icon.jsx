export function Icon({ name = "dot" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "cart") {
    return (
      <svg {...common}>
        <path {...stroke} d="M6 6h15l-1.5 8.5H7.2L6 6Z" />
        <path {...stroke} d="M6 6 5 3H2" />
        <path {...stroke} d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        <path {...stroke} d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <path {...stroke} d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        <path {...stroke} d="M16.5 16.5 21 21" />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg {...common}>
        <path
          {...stroke}
          d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z"
        />
        <path
          {...stroke}
          d="M19 12l.6 2.2L22 15l-2.4.8L19 18l-.6-2.2L16 15l2.4-.8L19 12Z"
        />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg {...common}>
        <path {...stroke} d="M4 4h7v7H4V4Z" />
        <path {...stroke} d="M13 4h7v7h-7V4Z" />
        <path {...stroke} d="M4 13h7v7H4v-7Z" />
        <path {...stroke} d="M13 13h7v7h-7v-7Z" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...common}>
        <path
          {...stroke}
          d="M20.5 8.5c0 6-8.5 11-8.5 11S3.5 14.5 3.5 8.5a4 4 0 0 1 7-2.6A4 4 0 0 1 20.5 8.5Z"
        />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg {...common}>
        <path {...stroke} d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z" />
        <path {...stroke} d="M3 8.5V18l9 5 9-5V8.5" />
      </svg>
    );
  }

  if (name === "chev") {
    return (
      <svg {...common}>
        <path {...stroke} d="M9 18 15 12 9 6" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path {...stroke} d="M12 5v14" />
        <path {...stroke} d="M5 12h14" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path {...stroke} d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

    if (name === "star") {
    return (
      <svg {...common}>
        <path
          {...stroke}
          d="M12 2.5l2.9 6 6.6 1-4.8 4.6 1.2 6.5L12 17.9 6.1 20.6l1.2-6.5L2.5 9.5l6.6-1L12 2.5Z"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
