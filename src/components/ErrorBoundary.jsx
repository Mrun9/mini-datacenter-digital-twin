import React from "react";

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
      return (
        <div className="report-modal-overlay animated-fadeIn">
          <div className="report-modal-dialog">
            <div className="light-report-container" style={{ padding: "40px", textAlign: "center" }}>
              <h3 style={{ color: "#dc2626", marginBottom: "12px" }}>⚠️ Error Loading Report</h3>
              <p style={{ color: "#475569", marginBottom: "20px" }}>
                {this.state.error?.message || "An unexpected error occurred while generating the acoustic report."}
              </p>
              <button
                className="secondary-print-btn"
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
    }

    return this.props.children;
  }
}
