import Plotly from 'plotly.js-cartesian-dist-min';

const layoutBarChart = {
  barmode: 'relative',
  dragmode: false,
  showlegend: true,
  plot_bgcolor: 'rgba(0,0,0,0)',
  autosize: true,
  margin: {
    l: 50,
    r: 50,
    b: 25,
    t: 100
  },
  yaxis: {
    automargin: true
  },
  legend: {
    orientation: 'h',
    yanchor: 'top',
    xanchor: 'center',
    x: 0.5,
    font: {
      size: 14
    }
  }
};

const layoutHistogram = {
  barmode: 'relative',
  dragmode: false,
  showlegend: true,
  plot_bgcolor: 'rgba(0,0,0,0)',
  autosize: true,
  margin: {
    l: 50,
    r: 50,
    b: 25,
    t: 100
  },
  yaxis: {
    automargin: true
  },
  legend: {
    orientation: 'h',
    yanchor: 'top',
    xanchor: 'center',
    x: 0.5,
    font: {
      size: 14
    }
  }
};

const options = {
  scrollZoom: false,
  displaylogo: false,
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: [
    'zoom2d',
    'pan2d',
    'select2d',
    'lasso2d',
    'zoomIn2d',
    'zoomOut2d',
    'autoScale2d',
    'resetScale2d',
    'hoverClosestGl2d',
    'hoverClosestPie',
    'toggleHover',
    'resetViews',
    'sendDataToCloud',
    'toggleSpikelines',
    'resetViewMapbox',
    'hoverClosestCartesian',
    'hoverCompareCartesian'
  ],
  toImageButtonOptions: {
    format: 'png',
    filename: 'chart',
    height: 600,
    width: 800,
    scale: 2
  }
};

let container;

class ChartHelper {
  static initChart(attribute) {
    if (!(typeof attribute === 'string')) {
      throw new Error('Expected type for argument attribute is String');
    }

    container = document.getElementById('chart');
    container.classList.add('loading');

    const trace = [
      {
        x: [],
        name: attribute,
        hoverinfo: 'none',
        marker: {
          color: 'rgba(133,133,133,1)'
        }
      }
    ];

    let layout;

    if (attribute === 'label') {
      trace[0].y = [];
      trace[0].type = 'bar';
      layout = layoutBarChart;
    } else {
      trace[0].type = 'histogram';
      layout = layoutHistogram;
    }

    Plotly.newPlot('chart', trace, layout, options);
  }

  static updateChart(attribute, data) {
    Plotly.prependTraces('chart', data, [0]);
  }

  static chartDone(attribute) {
    container.classList.remove('loading');
  }

  static clearChart() {
    Plotly.purge('chart');
  }
}

export default ChartHelper;
