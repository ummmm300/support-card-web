import "./App.css";

function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        background: "#f5f5f5",
        color: "#222",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif',
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "680px",
          padding: "32px 24px",
          boxSizing: "border-box",
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            margin: "0 0 24px",
            fontSize: "1.6rem",
            textAlign: "center",
          }}
        >
          現在、サイトの公開を停止しています
        </h1>

        <p
          style={{
            margin: "0 0 16px",
            lineHeight: 1.8,
          }}
        >
          本サイトは現在、公開を停止しています。
        </p>

        <p
          style={{
            margin: "0 0 16px",
            lineHeight: 1.8,
          }}
        >
          情報の更新・検証等をしていない状態のまま公開を続けることで、
          誤った情報の流布や検索の妨害をしてしまうことを避けるため、
          一時的にサイトを閉鎖することにしました。
        </p>

        <p
          style={{
            margin: "0 0 16px",
            lineHeight: 1.8,
          }}
        >
          現時点では、再公開の目処は立っていません。
        </p>

        <p
          style={{
            margin: "24px 0 0",
            paddingTop: "20px",
            borderTop: "1px solid #e5e5e5",
            color: "#666666",
            fontSize: "0.9rem",
            lineHeight: 1.7,
          }}
        >
          連絡先:https://x.com/wandering_sen
        </p>
      </section>
    </main>
  );
}

export default App;