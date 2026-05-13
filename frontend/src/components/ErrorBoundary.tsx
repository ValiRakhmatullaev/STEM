import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Unknown error" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("UI error boundary:", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: "system-ui", maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Что-то пошло не так</h1>
          <p style={{ color: "#444", marginBottom: 16 }}>
            Обновите страницу. Если ошибка повторяется, напишите в поддержку и приложите скриншот.
          </p>
          <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto" }}>
            {this.state.message}
          </pre>
          <button
            type="button"
            style={{ marginTop: 16, padding: "10px 16px", cursor: "pointer" }}
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
