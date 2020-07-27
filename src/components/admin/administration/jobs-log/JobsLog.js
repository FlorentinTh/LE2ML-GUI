import Component from '@Component';
import jobsLogTemplate from './jobs-log.hbs';
import jobsLogListTemplate from './log-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import EventSource from 'eventsource';

let logEntries;
class JobsLog extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Jobs Log';
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    this.initView(true);
    axios
      .get('/jobs/log/entries', {
        headers: APIHelper.setAuthHeader(),
        transformResponse: data => {
          return (data = data.split('\n').slice(0, -1));
        }
      })
      .then(response => {
        if (response) {
          const data = response.data;
          const dataArr = [];

          for (let i = 0; i < data.length; ++i) {
            dataArr.push(JSON.parse(data[i]));
          }
          logEntries = dataArr;
          this.render();
        }
      })
      // eslint-disable-next-line handle-callback-err
      .catch(error => {
        ModalHelper.error('Job logs could not be fetched. Please try again.');
      });
  }

  initView(loading = false) {
    this.context.innerHTML = jobsLogTemplate({
      title: this.title
    });

    if (loading) {
      this.buildLogEntriesList('#log-entries', {
        loading: loading
      });
    }
  }

  render() {
    this.initView();
    this.buildLogEntriesList('#log-entries');

    const logsContent = this.context.querySelector('.custom-scroll-logs');
    logsContent.scrollTop = logsContent.scrollHeight - logsContent.clientHeight;

    const downloadBtn = this.context.querySelector('.download-container');
    downloadBtn.addEventListener('click', this.downloadListener, false);

    const push = localStorage.getItem('admin-jobs-au');

    if (push === null) {
      localStorage.setItem('admin-jobs-au', false);
    }

    if (localStorage.getItem('admin-jobs-au') === 'true') {
      this.context.querySelector('#switch-on').checked = true;
      this.openEventSource(true);
    } else {
      this.context.querySelector('#switch-off').checked = true;
      this.closeEventSource();
    }

    const switchInputs = this.context.querySelectorAll(
      'div.switch-auto-update input[name="switch-au"]'
    );

    for (let i = 0; i < switchInputs.length; ++i) {
      const input = switchInputs[i];
      input.addEventListener('change', event => {
        if (event.target.id === 'switch-on') {
          this.buildLogEntriesList('#log-entries', { refresh: true });
          localStorage.setItem('admin-jobs-au', true);
          this.context.querySelector('#switch-on').checked = true;
          this.openEventSource(false);
        } else {
          localStorage.setItem('admin-jobs-au', false);
          this.closeEventSource();
        }
      });
    }
  }

  buildLogEntriesList(id, opts = { loading: false, refresh: false, autoScroll: false }) {
    const container = document.querySelector(id);

    let entries;
    if (opts.loading) {
      entries = [];
      container.innerHTML = jobsLogListTemplate({
        'log-entries': entries,
        loading: opts.loading
      });
    } else {
      if (opts.refresh) {
        axios
          .get('/jobs/log/entries', {
            headers: APIHelper.setAuthHeader(),
            transformResponse: data => {
              return (data = data.split('\n').slice(0, -1));
            }
          })
          .then(response => {
            if (response) {
              const data = response.data;
              const dataArr = [];

              for (let i = 0; i < data.length; ++i) {
                dataArr.push(JSON.parse(data[i]));
              }

              entries = dataArr;
              logEntries = entries;

              container.innerHTML = jobsLogListTemplate({
                'log-entries': entries,
                loading: opts.loading
              });
            }
          })
          // eslint-disable-next-line handle-callback-err
          .catch(error => {
            ModalHelper.error('Job logs could not be fetched. Please try again.');
          });
      } else {
        entries = logEntries;
        container.innerHTML = jobsLogListTemplate({
          'log-entries': entries,
          loading: opts.loading
        });

        if (opts.autoScroll) {
          const logsContent = this.context.querySelector('.custom-scroll-accent');
          logsContent.scrollTop = logsContent.scrollHeight - logsContent.clientHeight;
        }
      }
    }
  }

  downloadListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    window.open(
      new URL(window.env.FILE_SERVER_URL + '/' + window.env.JOB_LOGS_FILE),
      '_blank'
    );
  }

  openEventSource(close = false) {
    if (close) {
      this.closeEventSource();
    }

    const eventSourceStored = Store.get('event-source-admin');

    let eventSource;
    if (eventSourceStored === undefined) {
      eventSource = new EventSource('https://localhost:3000/api/v1/jobs/admin/changes', {
        headers: APIHelper.setAuthHeader()
      });

      Store.add({
        id: 'event-source-admin',
        data: eventSource
      });
    } else {
      eventSource = eventSourceStored.data;
    }

    eventSource.addEventListener('message', this.jobEventListener.bind(this), false);
  }

  jobEventListener(event) {
    const eventJob = JSON.parse(event.data);
    logEntries.push(eventJob);
    this.buildLogEntriesList('#log-entries', { autoScroll: true });
  }

  closeEventSource() {
    const eventSourceStored = Store.get('event-source-admin');

    if (!(eventSourceStored === undefined)) {
      eventSourceStored.data.close();
      Store.remove('event-source-admin');
    }
  }
}

export default JobsLog;
