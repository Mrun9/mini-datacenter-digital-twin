import React from "react";
import { createPortal } from "react-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const modal = (
        <div className="report-modal-overlay animated-fadeIn">
          <div className="report-modal-dialog minimal-dialog">
            <div className="minimal-report-canvas" style={{ padding: "40px", textAlign: "center" }}>
              <h3 style={{ color: "#dc2626", marginBottom: "12px" }}>⚠️ Error Loading Report</h3>
              <p style={{ color: "#475569", marginBottom: "20px" }}>
                {this.state.error?.message || "An unexpected error occurred while generating the acoustic report."}
              </p>
              <button
                className="min-btn"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
              >
                Close / Retry
              </button>
            </div>
          </div>
        </div>
      );

      return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
    }

    return this.props.children;
  }
}
