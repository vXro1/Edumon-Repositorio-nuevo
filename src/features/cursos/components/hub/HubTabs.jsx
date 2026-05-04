// src/features/cursos/components/hub/HubTabs.jsx

export default function HubTabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 4,
        borderBottom: "2px solid var(--color-border)",
        marginBottom: 24,
        overflowX: "auto",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "10px 16px",
            fontSize: 13.5,
            fontWeight: activeTab === tab.key ? 700 : 500,
            color:
              activeTab === tab.key
                ? "var(--color-primary)"
                : "var(--color-text-muted)",
            borderBottom: `2px solid ${
              activeTab === tab.key ? "var(--color-primary)" : "transparent"
            }`,
            marginBottom: -2,
            whiteSpace: "nowrap",
            transition: "all 150ms",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {tab.icon && <tab.icon style={{ width: 14, height: 14 }} />}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}