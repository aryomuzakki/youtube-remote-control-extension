import { useState, useEffect } from "react";

import {
  DEFAULT_CONFIG,
  type ExtensionConfig,
  type ActionType,
} from "../../utils/types";

function App() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await storage.getItem<ExtensionConfig>("local:config");
        if (stored) {
          setConfig({ ...DEFAULT_CONFIG, ...stored });
        }
      } catch (err) {
        console.error("Failed to load config from storage:", err);
      } finally {
        setLoaded(true);
      }
    };
    loadConfig();
  }, []);

  const updateConfig = async (updates: Partial<ExtensionConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await storage.setItem("local:config", newConfig);
  };

  const sendTestAction = async (action: ActionType, url?: string) => {
    await browser.runtime.sendMessage({
      type: "TEST_ACTION",
      action,
      url,
    });
  };

  if (!loaded) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: "16px", width: "300px", fontFamily: "sans-serif" }}>
      <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
        YT Remote Controller
      </h2>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
          />
          <strong>Enable Extension</strong>
        </label>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}
        >
          Room ID
        </label>
        <input
          type="text"
          value={config.roomId}
          onChange={(e) => updateConfig({ roomId: e.target.value })}
          style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label
          style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}
        >
          Open Link Behavior
        </label>
        <select
          value={config.openLinkBehavior}
          onChange={(e) =>
            updateConfig({ openLinkBehavior: e.target.value as any })
          }
          style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
        >
          <option value="CURRENT_TAB">Current YouTube Tab</option>
          <option value="NEW_TAB_IF_NO_ACTIVE">
            New Tab (If no active YT tab)
          </option>
          <option value="ALWAYS_NEW_TAB">Always New Tab</option>
        </select>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ccc",
          marginBottom: "16px",
        }}
      />

      <h3 style={{ fontSize: "14px", marginTop: 0, marginBottom: "8px" }}>
        Test Actions
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <button onClick={() => sendTestAction("PLAY")} style={btnStyle}>
          Play
        </button>
        <button onClick={() => sendTestAction("PAUSE")} style={btnStyle}>
          Pause
        </button>
        <button onClick={() => sendTestAction("PREV")} style={btnStyle}>
          Prev
        </button>
        <button onClick={() => sendTestAction("NEXT")} style={btnStyle}>
          Next
        </button>
      </div>
      <button
        onClick={() =>
          sendTestAction("OPEN_LINK", "https://youtube.com/watch?v=dQw4w9WgXcQ")
        }
        style={{ ...btnStyle, width: "100%" }}
      >
        Test Open Link
      </button>
    </div>
  );
}

const btnStyle = {
  padding: "8px",
  cursor: "pointer",
  background: "#454545ff",
  border: "1px solid #ccc",
  borderRadius: "4px",
};

export default App;
