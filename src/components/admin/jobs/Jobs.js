import Component from '@Component';
import jobsTemplate from './jobs.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import jobListTemplate from './job-list.hbs';
import ModalHelper from '@ModalHelper';
import Store from '@Store';
import EventSource from 'eventsource';

let startedJobs;
let completedJobs;

class Jobs extends Component {
  constructor(jobState = 'started', context = null) {
    super(context);
    this.jobState = jobState;
    this.title = 'Jobs';
    this.initData();
  }

  initData() {
    this.initView(true);

    getJobs('/jobs/user?state=started', this.context).then(response => {
      if (response) {
        startedJobs = response.data.jobs;

        getJobs('/jobs/user?state=completed', this.context).then(response => {
          if (response) {
            completedJobs = response.data.jobs;
            this.run();
          }
        });
      }
    });
  }

  initView(loading = false) {
    this.context.innerHTML = jobsTemplate({
      title: 'Jobs'
    });

    if (loading) {
      this.buildJobList(this.jobState, { loading: loading });
    }
  }

  buildJobList(value, opts = { loading: false, refresh: false }) {
    const container = document.querySelector('.grid-jobs');

    let jobs;
    if (opts.loading) {
      jobs = [];
      container.innerHTML = jobListTemplate({
        jobs: jobs,
        loading: opts.loading
      });
    } else {
      if (opts.refresh) {
        getJobs(`/jobs/user?state=${value}`, this.context).then(response => {
          if (response) {
            jobs = response.data.jobs;

            container.innerHTML = jobListTemplate({
              jobs: jobs,
              jobType: value,
              loading: opts.loading
            });

            this.setActions(jobs);

            if (value === 'started') {
              startedJobs = jobs;
            } else {
              completedJobs = jobs;
            }
          }
        });
      } else {
        if (value === 'started') {
          jobs = startedJobs;
        } else {
          jobs = completedJobs;
        }
      }

      container.innerHTML = jobListTemplate({
        jobs: jobs,
        jobType: value,
        loading: opts.loading
      });

      this.setActions(jobs);
    }
  }

  setActions(jobs) {
    this.cancelAction(jobs);
    this.restartAction(jobs);
    this.deleteAction(jobs);
  }

  cancelAction(jobs) {
    const icons = this.context.querySelectorAll('.state i');

    icons.forEach(icon => {
      const jobId = icon.closest('#job-infos').dataset.job;
      const job = jobs.find(elem => elem._id === jobId);

      icon.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Cancel job ?';
        const askMessage = job.label + ' will be canceled.';
        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            cancelJob('/jobs/cancel/' + jobId, null, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  job.label + ' successfully canceled.'
                );
                this.buildJobList(this.jobState, { refresh: true });
              }
            });
          }
        });
      });
    });
  }

  restartAction(jobs) {
    const buttons = this.context.querySelectorAll('button#restart');

    buttons.forEach(button => {
      const jobId = button.closest('#job-infos').dataset.job;
      const job = jobs.find(elem => elem._id === jobId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        restartJob('/jobs/restart/' + jobId, null, this.context).then(response => {
          if (response) {
            ModalHelper.notification('success', job.label + ' successfully started.');
            this.buildJobList(this.jobState, { refresh: true });
          }
        });
      });
    });
  }

  deleteAction(jobs) {
    const buttons = this.context.querySelectorAll('button#delete');

    buttons.forEach(button => {
      const jobId = button.closest('#job-infos').dataset.job;
      const job = jobs.find(elem => elem._id === jobId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Delete job ?';
        const askMessage = job.label + ' will be permanently deleted.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteJob('/jobs/' + jobId, this.context).then(response => {
              if (response) {
                ModalHelper.notification('success', job.label + ' successfully deleted.');
                this.buildJobList(this.jobState, { refresh: true });
              }
            });
          }
        });
      });
    });
  }

  jobStateSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      const value = event.target.value;
      this.jobState = value;
      this.buildJobList(value);
    }
  }

  jobEventListener(event) {
    const eventJob = JSON.parse(event.data);
    const jobs = this.jobState === 'complete' ? completedJobs : startedJobs;

    const isJobExists = jobs.filter(job => job._id === eventJob._id).length === 1;

    if (isJobExists) {
      this.buildJobList(this.jobState, { refresh: true });
    }
  }

  run() {
    this.initView();

    const jobStateSwitchInputs = this.context.querySelectorAll('.switch-group input');

    for (let i = 0; i < jobStateSwitchInputs.length; ++i) {
      const radio = jobStateSwitchInputs[i];

      if (radio.value === this.jobState) {
        radio.setAttribute('checked', true);
      }

      radio.addEventListener('change', this.jobStateSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.buildJobList(radio.value);
      }
    }

    const push = localStorage.getItem('auto-update');

    if (push === null) {
      localStorage.setItem('auto-update', false);
    }

    if (localStorage.getItem('auto-update') === 'true') {
      this.context.querySelector('#switch-on').checked = true;

      const eventSourceStored = Store.get('event-source');

      if (!(eventSourceStored === undefined)) {
        eventSourceStored.data.close();
        Store.remove('event-source');
      }
      const eventSource = new EventSource('https://localhost:3000/api/v1/jobs/changes', {
        headers: APIHelper.setAuthHeader()
      });

      Store.add({
        id: 'event-source',
        data: eventSource
      });

      eventSource.addEventListener('message', this.jobEventListener.bind(this), false);
    } else {
      this.context.querySelector('#switch-off').checked = true;

      const eventSourceStored = Store.get('event-source');

      if (!(eventSourceStored === undefined)) {
        eventSourceStored.data.close();
        Store.remove('event-source');
      }
    }

    const switchInputs = this.context.querySelectorAll(
      'div.switch-auto-update input[name="switch-au"]'
    );

    for (let i = 0; i < switchInputs.length; ++i) {
      const input = switchInputs[i];
      input.addEventListener('change', event => {
        if (event.target.id === 'switch-on') {
          this.buildJobList(this.jobState, { refresh: true });
          localStorage.setItem('auto-update', true);
          this.context.querySelector('#switch-on').checked = true;

          const eventSourceStored = Store.get('event-source');

          if (!(eventSourceStored === undefined)) {
            eventSourceStored.data.addEventListener(
              'message',
              this.jobEventListener.bind(this),
              false
            );
          } else {
            const eventSource = new EventSource(
              'https://localhost:3000/api/v1/jobs/changes',
              {
                headers: APIHelper.setAuthHeader()
              }
            );

            Store.add({
              id: 'event-source',
              data: eventSource
            });

            eventSource.addEventListener(
              'message',
              this.jobEventListener.bind(this),
              false
            );
          }
        } else {
          localStorage.setItem('auto-update', false);

          const eventSourceStored = Store.get('event-source');

          if (!(eventSourceStored === undefined)) {
            eventSourceStored.data.close();
            Store.remove('event-source');
          }
        }
      });
    }
  }
}

async function getJobs(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function cancelJob(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function restartJob(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function deleteJob(url, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default Jobs;
