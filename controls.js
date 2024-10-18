let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();
const url = new URLSearchParams(new URL(window.location.href).search);

var reviewed = 0, index = 0, total = 0;
var reviewData = [];
var colorMap = {
  'bad': 'red',
  'okay': 'yellow',
  'good': 'green',
  'special': 'blue',
  'special:bad': 'red',
  'special:okay': 'yellow',
  'special:good': 'green',
  'pending': 'silver',
};

document.addEventListener('x-memories-ready', () => {
  total = window.memoryData.length;
  window.memoryData.forEach(_ => {
    reviewData.push({ status: 'pending' });
  });

  updateStatusFields();
  document.addEventListener('keyup', controlListener);
  $('#btn-bad').addEventListener('click', controlBad);
  $('#btn-okay').addEventListener('click', controlOkay);
  $('#btn-good').addEventListener('click', controlGood);
  $('#btn-skip').addEventListener('click', controlSkip);
  $('#btn-special').addEventListener('click', controlSpecial);
  $('#btn-prev').addEventListener('click', controlPrev);
});

let controlListener = (key) => {
  console.log('DBG: Key pressed: ', key);
  switch (key) {
    case 'A': controlBad(); break;
    case 'S': controlOkay(); break;
    case 'D': controlGood(); break;
    case 'F': controlSkip(); break;
    case 'P': controlSpecial(); break;
    case 'Q': controlPrev(); break;
    default:
      break;
  }
}

let controlBad = () => {
  setStatus('bad');
  index = index + 1 >= total ? 0 : index + 1;
  waitUpdateStatusFields();
}

let controlOkay = () => {
  setStatus('okay');
  index = index + 1 >= total ? 0 : index + 1;
  waitUpdateStatusFields();
}

let controlGood = () => {
  setStatus('good');
  index = index + 1 >= total ? 0 : index + 1;
  waitUpdateStatusFields();
};

let controlSpecial = () => {
  setStatus('special');
}

let controlSkip = () => {
  index = index + 1 >= total ? 0 : index + 1;
  updateStatusFields();
}

let controlPrev = () => {
  index = index == 0 ? total - 1 : index - 1;
  updateStatusFields();
}

let setStatus = (status) => {
  if (reviewData[index].status == 'pending' && status != 'pending' && status != 'special') {
    reviewed += 1;
  }
  reviewData[index].status = reviewData[index].status == 'special' ? `special:${status}` : status;
  $('#current-memory').style.borderColor = colorMap[status];
  window.memoryElements[index].querySelector('img').style.borderColor = colorMap[status];
  if (status == 'special') {
    // TODO: check if classlist already has special
    window.memoryElements[index].querySelector('img').classList.add('special');
  }

  updateStatusFields();
}

let waitUpdateStatusFields = () => {
  setTimeout(updateStatusFields, 500);
}

let updateStatusFields = () => {
  console.log('DBG: Updating status fields');

  let data = window.memoryData[index];
  let fullDate = new Date(data.timestamp.seconds * 1000).toISOString();

  $('#current-memory').src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  $('#current-memory').style.borderColor = colorMap[reviewData[index].status];
  $('#curr-status').innerText = `[i = ${index}] ${reviewData[index].status}`;
  $('#curr-user-id').innerText = fm(data.userId);
  $('#curr-date').innerText = fullDate.split('T')[0];
  // $('#curr-time').innerText = fullDate.split('T')[1].split('.')[0];
  $('#curr-location').innerText = `${data.city}, ${data.country}`;
  $('#curr-tag1').innerText = `[w = ${data.tags[0].weight}] ${data.tags[0].keyword.toLowerCase()}`;
  $('#curr-tag2').innerText = `[w = ${data.tags[1].weight}] ${data.tags[1].keyword.toLowerCase()}`;
  $('#curr-tag3').innerText = `[w = ${data.tags[2].weight}] ${data.tags[2].keyword.toLowerCase()}`;

  let percentage = Math.round(reviewed / total * 100 * 100) / 100;
  if (isNaN(percentage)) percentage = 0;
  $('#status-counter').innerText = `${reviewed} / ${total} reviewed (${percentage}%)`;

  // only on first load.. basically
  if (index == 0) {
    $('#review-recipient').innerText = fm(data.userId);

    let minSeconds = window.memoryData[0].timestamp.seconds, maxSeconds = 0;
    window.memoryData.forEach(data => {
      minSeconds = Math.min(minSeconds, data.timestamp.seconds);
      maxSeconds = Math.max(minSeconds, data.timestamp.seconds);
    });
    let minDate = new Date(minSeconds * 1000).toISOString().split('T')[0];
    let maxDate = new Date(maxSeconds * 1000).toISOString().split('T')[0];
    $('#review-date-range').innerText = `${minDate} to ${maxDate}`;
  }
};
