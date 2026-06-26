import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, textAlign: 'center' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--c-red)' }}>error</span>
          <div className="t-lg">Something went wrong</div>
          <div className="t-sm muted">{this.state.error?.message}</div>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
