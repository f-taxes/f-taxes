/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-spinner/tp-spinner.js';
import { LitElement, html, css } from 'lit';
import { WsListener } from '../helpers/ws-listener.js';

class JobStatus extends WsListener(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 400px;
        }

        .panel {
          background: var(--card-box-background);
          box-shadow: var(--tp-popup-shadow, none);
          border-radius: 4px;
          z-index: 800;
          margin-top: 20px;
        }

        .job {
          display: flex;
          flex-direction: row;
          padding: 10px;
          justify-content: space-between;
          align-items: center;
        }

        label {
          display: block;
          margin-right: 20px;
        }

        h3 {
          padding: 10px;
          margin: 0;
          font-size: 16px;
        }

        * + h3 {
          margin-top: 20px;
        }

        tp-spinner {
          --tp-spinner-width: 14px;
          --tp-spinner-height: 14px;
        }
      `
    ];
  }

  render() {
    const jobList = Array.from(this.jobs.values());

    return html`
      ${jobList.length > 0 ? html`
      <div class="panel">
        ${jobList.length > 0 ? html`
          <h3>Processing Jobs</h3>
          ${jobList.map(job => this.renderJob(job))}
        ` : null}
      </div>
      ` : null}
    `;
  }

  renderJob(job) {
    return html`
      <div class="job">
        <label>${job.label}</label>
        ${job.progress > -1 ? html`
          <div>${job.progress}%</div>
        ` : html`
          <div><tp-spinner></tp-spinner></div>
        `}
      </div>
    `;
  }

  static get properties() {
    return {
      jobs: { type: Map },
    };
  }

  constructor() {
    super();
    this.jobs = new Map();
    this.warmupJobs = new Map();
  }

  onMsg(msg) {
    if (msg.event === 'job-progress') {
      const { data } = msg;

      if (data.progress === '100') {
        this.jobs.delete(data._id);
      } else {
        this.jobs.set(data._id, data);
      }
      this.requestUpdate('jobs');
    }
  }
}

window.customElements.define('job-status', JobStatus);
