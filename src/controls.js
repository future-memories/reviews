let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();

document.addEventListener('x-memories-ready', () => {
  console.log('[EVENT] x-memories-ready');
  for (let i = 0; i < window.memoryCards.length; i++) {
    window.memoryCards[i].addEventListener('click', () => {
      window.reviewState.index = i;
      waitUpdate();
    });
  }
  update();

  $('#btn-prev').addEventListener('click', controlPrev);
  $('#btn-skip').addEventListener('click', controlSkip);
  $('#btn-good').addEventListener('click', controlGood);
  $('#btn-bad').addEventListener('click', controlBad);
  $('#btn-task').addEventListener('click', controlTask);
  $('#btn-fail').addEventListener('click', controlFail);
  document.addEventListener('keyup', controlListener);

  $('#review-recipient').innerText = fm(window.reviewState.getMemory().userId);
  let minSeconds = window.memoryData[0].timestamp.seconds, maxSeconds = 0;
  window.memoryData.forEach(data => {
    minSeconds = Math.min(minSeconds, data.timestamp.seconds);
    maxSeconds = Math.max(maxSeconds, data.timestamp.seconds);
  });
  let minDate = new Date(minSeconds * 1000).toISOString().split('T')[0];
  let maxDate = new Date(maxSeconds * 1000).toISOString().split('T')[0];
  $('#review-date-range').innerText = `${minDate} to ${maxDate}`;
});

let controlListener = (event) => {
  if (document.activeElement === $('#comment')) return;
  // console.log('DBG: Key pressed: ', event);
  switch (event.key) {
    case 'ArrowLeft': controlPrev(); break;
    case 'ArrowRight': controlSkip(); break;
    case 'a': controlGood(); break;
    case 's': controlBad(); break;
    case 'd': controlTask(); break;
    case 'f': controlFail(); break;
    default: break;
  }
}

let controlSkip = () => { window.reviewState.moveIndexBy(1); update(); }
let controlPrev = () => { window.reviewState.moveIndexBy(-1); update(); }
let controlGood = () => { window.reviewState.setStatus("good"); window.reviewState.moveIndexBy(1); waitUpdate(); }
let controlBad = () => { window.reviewState.setStatus("bad"); window.reviewState.moveIndexBy(1); waitUpdate(); }
let controlTask = () => { window.reviewState.setStatus("task"); window.reviewState.moveIndexBy(1); waitUpdate(); }
let controlFail = () => { window.reviewState.setStatus("fail"); window.reviewState.moveIndexBy(1); waitUpdate(); }

let waitUpdate = () => setTimeout(update, 100);
let update = () => {
  $('#status-counter').innerText = `${window.reviewState.reviewed} / ${window.reviewState.total} reviewed (${window.reviewState.getPercentageReviewed()}%)`;

  // if 100%, show the submit review button
  if (window.reviewState.reviewed == window.reviewState.total) {
    $('#review > form > button[type="submit"]').disabled = false;
  }
  // if review is submitted, show print button (or enable it)
  if (window.reviewState.submitted) {
    $('#review > form > button[type="submit"]').disabled = true;
    $('button#btn-print').disabled = false;
  }

  updateCurrentMemory();
};

let updateCurrentMemory = () => {
  let data = window.reviewState.getMemory();
  let status = window.reviewState.getStatus();

  $('#current-memory img').src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  $('#current-memory img').className = status;

  let fullDate = new Date(data.timestamp.seconds * 1000).toISOString();
  $('#status .date').innerText = fullDate.split('T')[0];
  $('#status .time').innerText = fullDate.split('T')[1].split('.')[0];

  $('#status .status').innerText = `[i = ${window.reviewState.index}] ${status}`;
  $('#status .location').innerText = `${data.city}, ${data.country}`;
  $('#status .type').innerText = `${data.type}`;

  for (let i = 0; i < 3 && i < data.tags.length; i++)
    $(`#status .tag${i + 1}`).innerText = `[w = ${data.tags[i].weight}] ${data.tags[i].keyword.toLowerCase()}`;
  for (let i = data.tags.length; i < 3; i++)
    $(`#status .tag${i + 1}`).innerText = "[w = ?] N/A";
}
